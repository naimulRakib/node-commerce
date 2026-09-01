import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { logAudit } from "./audit";

// =============================================================================
// TRANSACTIONAL BUSINESS LOGIC
// =============================================================================
// Demonstrates ACID properties via Prisma's $transaction() API.
// All writes in a transaction either ALL succeed or ALL fail (Atomicity).
// Serializable isolation prevents phantom reads in concurrent checkout.
// =============================================================================

export type PlaceOrderInput = {
  customerId: number;
  shippingAddressId: number;
  courierId?: number;
  couponCode?: string;
  paymentMethod: string; // card, bkash, nagad, wallet, cod
};

export type PlaceOrderResult =
  | { success: true; orderId: number }
  | { success: false; error: string };

// ─── Place Order Transaction ──────────────────────────────────
// Academic Note: This demonstrates:
// • Serializable isolation level — prevents two users buying the last item
// • Atomicity — all 7 steps succeed or the entire TX rolls back
// • Price snapshots — unit_price copied at order time, never references live price
// • Inventory deduction — both Inventory (product-level) and VariantInventory (variant-level)
// • Controlled denormalization — total_amount stored on order for read performance

export async function placeOrder(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  const { customerId, shippingAddressId, courierId, couponCode, paymentMethod } = input;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // ── Step 1: Fetch cart with items ──────────────────────
        const cart = await tx.cart.findUnique({
          where: { customer_id: customerId },
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        });

        if (!cart || cart.items.length === 0) {
          throw new Error("Cart is empty");
        }

        // ── Step 2: Validate stock for each item ───────────────
        for (const item of cart.items) {
          if (item.variant_code && item.variant) {
            // Check variant-level inventory first
            const variantStock = await tx.variantInventory.findFirst({
              where: { variant_code: item.variant_code },
              orderBy: { quantity: "desc" },
            });
            if (!variantStock || variantStock.quantity < item.quantity) {
              throw new Error(
                `Insufficient stock for ${item.product.name} (${item.variant.color ?? ""} ${item.variant.size ?? ""}). Only ${variantStock?.quantity ?? 0} left.`
              );
            }
          } else {
            // Fall back to product-level inventory
            const stock = await tx.inventory.findFirst({
              where: { product_id: item.product_id },
              orderBy: { quantity: "desc" },
            });
            if (!stock || stock.quantity < item.quantity) {
              throw new Error(
                `Insufficient stock for ${item.product.name}. Only ${stock?.quantity ?? 0} left.`
              );
            }
          }
        }

        // ── Step 3: Calculate totals ───────────────────────────
        let subtotal = new Prisma.Decimal(0);
        for (const item of cart.items) {
          const unitPrice = item.variant?.price_override ?? item.product.base_price;
          subtotal = subtotal.plus(new Prisma.Decimal(unitPrice).times(item.quantity));
        }

        let discountAmount = new Prisma.Decimal(0);
        let coupon = null;

        if (couponCode) {
          coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
          if (
            coupon &&
            coupon.is_active &&
            subtotal.gte(coupon.min_spend) &&
            (!coupon.expiry_date || coupon.expiry_date > new Date()) &&
            (!coupon.usage_limit || coupon.usage_count < coupon.usage_limit)
          ) {
            if (coupon.discount_type === "percentage") {
              discountAmount = subtotal.times(coupon.discount_value).dividedBy(100);
              if (coupon.max_discount) {
                discountAmount = Prisma.Decimal.min(discountAmount, coupon.max_discount);
              }
            } else {
              discountAmount = coupon.discount_value;
            }
          }
        }

        const shippingFee = new Prisma.Decimal(subtotal.gte(999) ? 0 : 60);
        const totalAmount = subtotal.minus(discountAmount).plus(shippingFee);

        // ── Step 4: Create CustomerOrder ───────────────────────
        const order = await tx.customerOrder.create({
          data: {
            customer_id: customerId,
            courier_id: courierId ?? null,
            coupon_code: coupon ? couponCode : null,
            shipping_address_id: shippingAddressId,
            status: "pending",
            subtotal,
            discount_amount: discountAmount,
            shipping_fee: shippingFee,
            total_amount: totalAmount,
          },
        });

        // ── Step 5: Create OrderItems (price snapshot) ─────────
        for (const item of cart.items) {
          // Price snapshot: copied at order time — never reference live price later
          const unitPrice = item.variant?.price_override ?? item.product.base_price;
          const lineTotal = new Prisma.Decimal(unitPrice).times(item.quantity);

          await tx.orderItem.create({
            data: {
              order_id: order.order_id,
              product_id: item.product_id,
              variant_code: item.variant_code ?? null,
              quantity: item.quantity,
              unit_price: unitPrice,
              line_total: lineTotal,
            },
          });
        }

        // ── Step 6: Deduct inventory ───────────────────────────
        for (const item of cart.items) {
          if (item.variant_code) {
            // Variant-level deduction
            await tx.variantInventory.updateMany({
              where: { variant_code: item.variant_code },
              data: { quantity: { decrement: item.quantity } },
            });
            // Also update variant.quantity
            await tx.productVariant.update({
              where: { variant_code: item.variant_code },
              data: { quantity: { decrement: item.quantity } },
            });
          }
          // Product-level deduction (Inventory table)
          await tx.inventory.updateMany({
            where: { product_id: item.product_id },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        // ── Step 7: Create Invoice ─────────────────────────────
        await tx.invoice.create({
          data: {
            order_id: order.order_id,
            tax_amount: totalAmount.times(0.05), // 5% VAT
            tax_rate: 5.0,
            status: "issued",
          },
        });

        // ── Step 8: Create Payment record ──────────────────────
        const txid = `NC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        await tx.payment.create({
          data: {
            order_id: order.order_id,
            txid,
            amount: totalAmount,
            method: paymentMethod,
            status: paymentMethod === "cod" ? "pending" : "success",
            paid_at: paymentMethod !== "cod" ? new Date() : null,
          },
        });

        // ── Step 9: Increment coupon usage ─────────────────────
        if (coupon && couponCode) {
          await tx.coupon.update({
            where: { code: couponCode },
            data: { usage_count: { increment: 1 } },
          });
        }

        // ── Step 10: Clear cart items ──────────────────────────
        await tx.cartItem.deleteMany({ where: { cart_id: cart.cart_id } });

        // ── Step 11: Audit log (non-blocking — logged outside TX) ──
        return order;
      },
      {
        // Serializable isolation: prevents phantom reads where two concurrent
        // users buy the same last item. If concurrent TX conflicts, Postgres
        // will abort one and the client retries. Academic: highest isolation level.
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      }
    );

    // Audit outside transaction (non-blocking)
    await logAudit("customer_order", result.order_id, "INSERT", customerId, null, {
      order_id: result.order_id,
      status: "pending",
      total_amount: result.total_amount,
    });

    return { success: true, orderId: result.order_id };
  } catch (error) {
    console.error("[placeOrder] Transaction failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Order placement failed",
    };
  }
}

// ─── Cancel Order Transaction ─────────────────────────────────
export async function cancelOrder(
  orderId: number,
  cancelledBy: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.customerOrder.findUnique({
        where: { order_id: orderId },
        include: { items: true },
      });

      if (!order) throw new Error("Order not found");
      if (!["pending", "confirmed"].includes(order.status)) {
        throw new Error("Order cannot be cancelled at this stage");
      }

      const oldStatus = order.status;

      // Restore inventory
      for (const item of order.items) {
        if (item.variant_code) {
          await tx.variantInventory.updateMany({
            where: { variant_code: item.variant_code },
            data: { quantity: { increment: item.quantity } },
          });
          await tx.productVariant.update({
            where: { variant_code: item.variant_code },
            data: { quantity: { increment: item.quantity } },
          });
        }
        await tx.inventory.updateMany({
          where: { product_id: item.product_id },
          data: { quantity: { increment: item.quantity } },
        });
      }

      await tx.customerOrder.update({
        where: { order_id: orderId },
        data: { status: "cancelled" },
      });

      // Audit (in transaction for cancellations — must be atomic)
      await tx.auditLog.create({
        data: {
          table_name: "customer_order",
          record_id: orderId,
          action: "UPDATE",
          changed_by: cancelledBy,
          old_data: { status: oldStatus },
          new_data: { status: "cancelled" },
        },
      });
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Cancellation failed",
    };
  }
}

// ─── Update Order Status (Admin) ──────────────────────────────
export async function updateOrderStatus(
  orderId: number,
  newStatus: string,
  adminId: number,
  courierId?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.customerOrder.findUnique({
      where: { order_id: orderId },
    });
    if (!order) return { success: false, error: "Order not found" };

    const oldStatus = order.status;

    const updateData: Prisma.CustomerOrderUpdateInput = { status: newStatus };
    if (courierId) updateData.courier = { connect: { courier_id: courierId } };

    await prisma.customerOrder.update({
      where: { order_id: orderId },
      data: updateData,
    });

    // Create shipment record when moving to processing (courier approved)
    if (newStatus === "processing" && order.courier_id) {
      const existing = await prisma.shipment.findUnique({ where: { order_id: orderId } });
      if (!existing) {
        await prisma.shipment.create({
          data: {
            order_id: orderId,
            courier_id: order.courier_id,
            status: "preparing",
            estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    // Update shipment when shipped
    if (newStatus === "shipped") {
      await prisma.shipment.updateMany({
        where: { order_id: orderId },
        data: {
          status: "in_transit",
          dispatched_at: new Date(),
          tracking_number: `NC-TRK-${orderId}-${Date.now().toString(36).toUpperCase()}`,
        },
      });
    }

    // Update shipment when delivered
    if (newStatus === "delivered") {
      await prisma.shipment.updateMany({
        where: { order_id: orderId },
        data: { status: "delivered", delivered_at: new Date() },
      });
    }

    await logAudit("customer_order", orderId, "UPDATE", adminId, { status: oldStatus }, { status: newStatus });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Status update failed",
    };
  }
}
