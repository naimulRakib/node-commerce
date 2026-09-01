"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth";
import { placeOrder, cancelOrder } from "@/lib/transactions";

// ─── Place Order ──────────────────────────────────────────────
export async function placeOrderAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireCustomer();

  const shippingAddressId = Number(formData.get("shippingAddressId"));
  const courierId = formData.get("courierId") ? Number(formData.get("courierId")) : undefined;
  const couponCode = (formData.get("couponCode") as string) || undefined;
  const paymentMethod = (formData.get("paymentMethod") as string) || "cod";

  if (!shippingAddressId) return { error: "Please select a shipping address" };

  const result = await placeOrder({
    customerId: session.id,
    shippingAddressId,
    courierId,
    couponCode,
    paymentMethod,
  });

  if (!result.success) return { error: result.error };

  redirect(`/checkout/confirmation/${result.orderId}`);
}

// ─── Cancel Order (Customer) ──────────────────────────────────
export async function cancelOrderAction(orderId: number): Promise<{ error?: string }> {
  const session = await requireCustomer();

  // Verify order belongs to this customer
  const order = await prisma.customerOrder.findFirst({
    where: { order_id: orderId, customer_id: session.id },
  });
  if (!order) return { error: "Order not found" };

  const result = await cancelOrder(orderId, session.id);
  if (!result.success) return { error: result.error };

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  return {};
}

// ─── Request Return ───────────────────────────────────────────
export async function requestReturnAction(
  orderId: number,
  productId: number,
  reason: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireCustomer();

  // Verify order belongs to customer and is delivered
  const order = await prisma.customerOrder.findFirst({
    where: { order_id: orderId, customer_id: session.id, status: "delivered" },
  });
  if (!order) return { error: "Order not found or not eligible for return" };

  await prisma.returnRequest.create({
    data: {
      order_id: orderId,
      product_id: productId,
      reason,
      status: "requested",
    },
  });

  revalidatePath(`/account/orders/${orderId}`);
  return { success: true };
}

// ─── Add Address ──────────────────────────────────────────────
export async function addAddressAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireCustomer();

  const label = (formData.get("label") as string) || "home";
  const address_line1 = formData.get("address_line1") as string;
  const address_line2 = (formData.get("address_line2") as string) || undefined;
  const city = formData.get("city") as string;
  const district = (formData.get("district") as string) || undefined;
  const postal_code = (formData.get("postal_code") as string) || undefined;
  const is_default = formData.get("is_default") === "on";

  if (!address_line1 || !city) return { error: "Address line 1 and city are required" };

  await prisma.$transaction(async (tx) => {
    if (is_default) {
      await tx.address.updateMany({
        where: { customer_id: session.id },
        data: { is_default: false },
      });
    }
    await tx.address.create({
      data: {
        customer_id: session.id,
        label,
        address_line1,
        address_line2,
        city,
        district,
        postal_code,
        is_default,
      },
    });
  });

  revalidatePath("/account/profile");
  revalidatePath("/checkout");
  return {};
}
