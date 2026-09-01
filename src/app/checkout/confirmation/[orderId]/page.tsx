import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderStatusBadge from "@/components/OrderStatusBadge";

export const metadata: Metadata = {
  title: "Order Confirmed — NodeCommerce",
  description: "Your order has been placed successfully.",
};

type Props = { params: Promise<{ orderId: string }> };

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderId } = await params;
  const session = await requireCustomer();

  const order = await prisma.customerOrder.findFirst({
    where: { order_id: Number(orderId), customer_id: session.id },
    include: {
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { color: true, size: true } },
        },
      },
      shipment: true,
      courier: { select: { name: true } },
      invoice: true,
      shipping_address: true,
    },
  });

  if (!order) notFound();

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "100vh" }}>
        <div className="container" style={{ padding: "60px 24px", maxWidth: 760 }}>
          {/* Success Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40, margin: "0 auto 20px",
            }}>✅</div>
            <h1 style={{
              fontFamily: "Outfit, sans-serif", fontWeight: 900,
              fontSize: 36, color: "white", marginBottom: 10,
            }}>Order Confirmed!</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, marginBottom: 16 }}>
              Thank you for your purchase. We&apos;ll process your order soon.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Order ID:</span>
              <span style={{
                fontFamily: "monospace", fontWeight: 700, color: "#eab308",
                background: "rgba(234,179,8,0.1)", padding: "4px 12px", borderRadius: 8,
              }}>#{order.order_id}</span>
            </div>
          </div>

          {/* Order Details */}
          <div style={{
            background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: 28, marginBottom: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18 }}>
                Order Details
              </h2>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {order.items.map((item) => (
                <div key={item.order_item_id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "white", fontSize: 14 }}>{item.product.name}</div>
                    {item.variant && (
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>
                        {item.variant.color && `${item.variant.color}`}
                        {item.variant.size && ` • ${item.variant.size}`}
                        {` • Qty: ${item.quantity}`}
                      </div>
                    )}
                  </div>
                  <div className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16 }}>
                    ৳{Number(item.line_total).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Subtotal</span>
                <span style={{ color: "white" }}>৳{Number(order.subtotal).toLocaleString()}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#4ade80", fontSize: 14 }}>Discount</span>
                  <span style={{ color: "#4ade80" }}>−৳{Number(order.discount_amount).toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Shipping</span>
                <span style={{ color: "white" }}>
                  {Number(order.shipping_fee) === 0 ? "FREE" : `৳${Number(order.shipping_fee)}`}
                </span>
              </div>
              {order.invoice && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>VAT ({Number(order.invoice.tax_rate)}%)</span>
                  <span style={{ color: "white" }}>৳{Number(order.invoice.tax_amount).toFixed(2)}</span>
                </div>
              )}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Total Paid</span>
                <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900, fontSize: 22 }}>
                  ৳{Number(order.total_amount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          {order.shipping_address && (
            <div style={{
              background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20, padding: 24, marginBottom: 24,
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
            }}>
              <div>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                  Shipping To
                </h3>
                <p style={{ color: "white", fontSize: 14, lineHeight: 1.7 }}>
                  {order.shipping_address.address_line1}<br />
                  {order.shipping_address.city}
                  {order.shipping_address.district && `, ${order.shipping_address.district}`}
                </p>
              </div>
              <div>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                  Courier
                </h3>
                <p style={{ color: "white", fontSize: 14 }}>{order.courier?.name ?? "To be assigned"}</p>
                {order.shipment?.tracking_number && (
                  <p style={{ color: "#eab308", fontSize: 13, fontFamily: "monospace", marginTop: 4 }}>
                    {order.shipment.tracking_number}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/account/orders" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              View My Orders
            </Link>
            <Link href="/products" className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
