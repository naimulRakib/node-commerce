import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import AdminOrderActions from "./AdminOrderActions";

export const metadata: Metadata = { title: "Manage Order — Admin" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  const [order, couriers, auditLogs] = await Promise.all([
    prisma.customerOrder.findUnique({
      where: { order_id: Number(id) },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true, product_code: true } },
            variant: { select: { color: true, size: true, sku: true } },
          },
        },
        payments: true,
        invoice: true,
        shipment: true,
        courier: true,
        shipping_address: true,
        return_requests: { include: { product: { select: { name: true } } } },
      },
    }),
    prisma.courier.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
    prisma.auditLog.findMany({
      where: { table_name: "customer_order", record_id: Number(id) },
      orderBy: { changed_at: "desc" },
      take: 10,
    }),
  ]);

  if (!order) notFound();

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <Link href="/admin/orders" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}>← Back to Orders</Link>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 26, color: "white", marginTop: 8 }}>
            Order <span style={{ color: "#eab308" }}>#{order.order_id}</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>
            {new Date(order.order_date).toLocaleString()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Customer Info */}
          <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 16 }}>👤 Customer</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Name</span>
                <span style={{ color: "white", fontSize: 14, fontWeight: 600 }}>{order.customer.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Email</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{order.customer.email}</span>
              </div>
              {order.customer.phone && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Phone</span>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{order.customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 20 }}>📦 Order Items</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Product", "SKU", "Variant", "Qty", "Unit Price", "Total"].map(h => (
                    <th key={h} style={{ padding: "8px 0", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.35)", borderBottom: "1px solid rgba(255,255,255,0.05)", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.order_item_id}>
                    <td style={{ padding: "10px 0", color: "white", fontSize: 13, fontWeight: 500, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{item.product.name}</td>
                    <td style={{ padding: "10px 0", color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "monospace", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{item.variant?.sku ?? item.product.product_code}</td>
                    <td style={{ padding: "10px 0", color: "rgba(255,255,255,0.5)", fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      {item.variant ? `${item.variant.color ?? ""}${item.variant.size ? ` / ${item.variant.size}` : ""}` : "—"}
                    </td>
                    <td style={{ padding: "10px 0", color: "white", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{item.quantity}</td>
                    <td style={{ padding: "10px 0", color: "rgba(255,255,255,0.7)", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>৳{Number(item.unit_price).toLocaleString()}</td>
                    <td style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>৳{Number(item.line_total).toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { l: "Subtotal", v: `৳${Number(order.subtotal).toLocaleString()}` },
                { l: "Discount", v: `-৳${Number(order.discount_amount).toLocaleString()}`, hide: Number(order.discount_amount) === 0 },
                { l: "Shipping", v: Number(order.shipping_fee) === 0 ? "FREE" : `৳${Number(order.shipping_fee)}` },
                ...(order.invoice ? [{ l: `VAT (${Number(order.invoice.tax_rate)}%)`, v: `৳${Number(order.invoice.tax_amount).toFixed(2)}` }] : []),
              ].filter(r => !r.hide).map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{r.l}</span>
                  <span style={{ color: "white", fontSize: 13 }}>{r.v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ color: "white", fontWeight: 700 }}>Total</span>
                <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 18 }}>৳{Number(order.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Shipment + Audit */}
          {order.shipment && (
            <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 16 }}>🚚 Shipment</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { l: "Tracking", v: order.shipment.tracking_number ?? "Not assigned" },
                  { l: "Status", v: <OrderStatusBadge status={order.shipment.status} /> },
                  { l: "Courier", v: order.courier?.name ?? "—" },
                  { l: "Est. Delivery", v: order.shipment.estimated_delivery ? new Date(order.shipment.estimated_delivery).toLocaleDateString() : "—" },
                  ...(order.shipment.delivered_at ? [{ l: "Delivered At", v: new Date(order.shipment.delivered_at).toLocaleString() }] : []),
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{row.l}</span>
                    <span style={{ color: "white", fontSize: 13, fontFamily: "monospace" }}>{row.v as React.ReactNode}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log */}
          {auditLogs.length > 0 && (
            <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 16 }}>📋 Audit Log</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {auditLogs.map(log => (
                  <div key={log.log_id} style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#eab308", fontWeight: 600 }}>{log.action}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{new Date(log.changed_at).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                      {log.old_data ? JSON.stringify(log.old_data) : "—"} → {log.new_data ? JSON.stringify(log.new_data) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <AdminOrderActions
            orderId={order.order_id}
            status={order.status}
            couriers={couriers.map(c => ({ courier_id: c.courier_id, name: c.name }))}
            currentCourierId={order.courier_id}
          />

          {/* Return Requests */}
          {order.return_requests.length > 0 && (
            <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "#f87171", fontSize: 16, marginBottom: 16 }}>↩️ Return Requests</h2>
              {order.return_requests.map(rr => (
                <div key={rr.return_id} style={{ padding: 12, background: "rgba(239,68,68,0.05)", borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{rr.product.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>{rr.reason}</div>
                  <div style={{ marginTop: 8 }}><OrderStatusBadge status={rr.status} /></div>
                </div>
              ))}
            </div>
          )}

          {/* Shipping Address */}
          {order.shipping_address && (
            <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 12 }}>📍 Shipping Address</h2>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.7 }}>
                {order.shipping_address.address_line1}<br />
                {order.shipping_address.city}{order.shipping_address.district ? `, ${order.shipping_address.district}` : ""}
                {order.shipping_address.postal_code && ` - ${order.shipping_address.postal_code}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
