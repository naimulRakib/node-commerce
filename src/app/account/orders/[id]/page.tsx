import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { CancelOrderButton, ReturnRequestForm } from "./OrderActions";

export const metadata: Metadata = { title: "Order Details — NodeCommerce" };

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireCustomer();

  const order = await prisma.customerOrder.findFirst({
    where: { order_id: Number(id), customer_id: session.id },
    include: {
      items: {
        include: {
          product: { select: { product_id: true, name: true } },
          variant: { select: { color: true, size: true } },
        },
      },
      payments: true,
      invoice: true,
      shipment: true,
      courier: true,
      shipping_address: true,
      return_requests: true,
    },
  });

  if (!order) notFound();

  const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const currentStep = steps.indexOf(order.status);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <Link href="/account/orders" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}>
            ← Back to Orders
          </Link>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 26, color: "white", marginTop: 8 }}>
            Order <span style={{ color: "#eab308" }}>#{order.order_id}</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>
            Placed on {new Date(order.order_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Progress Stepper */}
      {order.status !== "cancelled" && (
        <div style={{
          background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20, padding: 28, marginBottom: 24,
        }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 24 }}>
            Order Progress
          </h2>
          <div style={{ display: "flex", alignItems: "center" }}>
            {steps.map((step, i) => {
              const done = i <= currentStep;
              const isActive = i === currentStep;
              return (
                <div key={step} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: done ? "linear-gradient(135deg, #eab308, #ca8a04)" : "rgba(255,255,255,0.06)",
                      border: isActive ? "2px solid #eab308" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: done ? "white" : "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 700,
                    }}>{done ? "✓" : i + 1}</div>
                    <span style={{ fontSize: 11, color: done ? "#eab308" : "rgba(255,255,255,0.3)", textTransform: "capitalize", whiteSpace: "nowrap" }}>
                      {step}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{
                      flex: 1, height: 2, margin: "0 8px", marginBottom: 20,
                      background: i < currentStep ? "linear-gradient(90deg, #eab308, #ca8a04)" : "rgba(255,255,255,0.06)",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Items */}
        <div style={{
          background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20, padding: 24,
        }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 20 }}>
            Items Ordered
          </h2>
          {order.items.map((item) => (
            <div key={item.order_item_id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              <div>
                <Link href={`/products/${item.product.product_id}`} style={{ color: "white", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                  {item.product.name}
                </Link>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>
                  {item.variant?.color} {item.variant?.size && `• ${item.variant.size}`} • Qty: {item.quantity}
                </div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>
                  @ ৳{Number(item.unit_price).toLocaleString()} each
                </div>
                {order.status === "delivered" && (
                  <div style={{ marginTop: 8 }}>
                    <ReturnRequestForm orderId={order.order_id} productId={item.product.product_id} />
                  </div>
                )}
              </div>
              <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
                ৳{Number(item.line_total).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Summary + Shipping */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Totals */}
          <div style={{
            background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: 24,
          }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 16 }}>
              Summary
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Subtotal", value: `৳${Number(order.subtotal).toLocaleString()}` },
                { label: "Discount", value: `-৳${Number(order.discount_amount).toLocaleString()}`, hide: Number(order.discount_amount) === 0 },
                { label: "Shipping", value: Number(order.shipping_fee) === 0 ? "FREE" : `৳${Number(order.shipping_fee)}` },
                ...(order.invoice ? [{ label: `VAT (${Number(order.invoice.tax_rate)}%)`, value: `৳${Number(order.invoice.tax_amount).toFixed(2)}` }] : []),
              ].filter(r => !r.hide).map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>{row.label}</span>
                  <span style={{ color: "white", fontSize: 14 }}>{row.value}</span>
                </div>
              ))}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "6px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "white", fontWeight: 700 }}>Total</span>
                <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 18 }}>
                  ৳{Number(order.total_amount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div style={{
            background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: 20,
          }}>
            <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 15, marginBottom: 12 }}>Payment</h3>
            {order.payments.map((p) => (
              <div key={p.payment_id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.method.toUpperCase()}</span>
                <OrderStatusBadge status={p.status} />
              </div>
            ))}
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div style={{
              background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20, padding: 20,
            }}>
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 15, marginBottom: 10 }}>Shipping To</h3>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.7 }}>
                {order.shipping_address.address_line1}<br />
                {order.shipping_address.city}{order.shipping_address.district ? `, ${order.shipping_address.district}` : ""}
              </p>
              {order.courier && (
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 8 }}>
                  via {order.courier.name}
                  {order.shipment?.tracking_number && ` • ${order.shipment.tracking_number}`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel */}
      {order.status === "pending" && (
        <div style={{
          background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)",
          borderRadius: 16, padding: 20,
        }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginBottom: 12 }}>
            This order can still be cancelled.
          </p>
          <CancelOrderButton orderId={order.order_id} />
        </div>
      )}
    </div>
  );
}
