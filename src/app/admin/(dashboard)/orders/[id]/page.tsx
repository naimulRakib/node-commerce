// এসইও (SEO) এর জন্য মেটাডেটা ইন্টারফেস।
import { Metadata } from "next";
// যদি কোনো অর্ডার না পাওয়া যায়, তবে ৪MD (404 Not Found) পেজ রেন্ডার করার জন্য।
import { notFound } from "next/navigation";
// ক্লায়েন্ট-সাইড নেভিগেশনের জন্য লিঙ্ক কম্পোনেন্ট।
import Link from "next/link";
// ডাটাবেসের সাথে সরাসরি ইন্টারঅ্যাক্ট করার জন্য।
import { db } from "@/lib/db";
// স্ট্যাটাস অনুযায়ী কালার-কোডেড ব্যাজ দেখানোর জন্য কাস্টম কম্পোনেন্ট।
import OrderStatusBadge from "@/components/OrderStatusBadge";
// অ্যাডমিন কর্তৃক অর্ডার স্ট্যাটাস পরিবর্তন করার ক্লায়েন্ট-সাইড কম্পোনেন্ট।
import AdminOrderActions from "./AdminOrderActions";

// ─── মেটাডেটা (Metadata) ──────────────────────────────────────────────────────────
export const metadata: Metadata = { title: "Manage Order — Admin" };

// ডায়নামিক রাউটিং এর প্রপস টাইপ ডেফিনিশন (Dynamic Routing Props Definition)।
type Props = { params: Promise<{ id: string }> };

// ─── সার্ভার কম্পোনেন্ট (Server Component) ──────────────────────────────
export default async function AdminOrderDetailPage({ params }: Props) {
  // ডায়নামিক রাউট প্যারামিটার থেকে অর্ডারের আইডি (id) এক্সট্র্যাক্ট করা হচ্ছে।
  const { id } = await params;

  // ১. প্রাথমিক ডেটা ফেচিং (Initial Data Fetching):
  // অর্ডারের বেস (Base) ডেটা, সম্ভাব্য কুরিয়ার লিস্ট এবং অডিট লগ প্যারালালি ফেচ করা হচ্ছে।
  const [orderRes, couriersRes, auditLogsRes] = await Promise.all([
    db.query('SELECT * FROM customer_order WHERE order_id = $1', [Number(id)]),
    db.query('SELECT * FROM courier WHERE is_active = true ORDER BY name ASC'),
    // সিকিউরিটি অডিটের জন্য সর্বশেষ ১০টি পরিবর্তন (Audit Logs) আনা হচ্ছে।
    db.query('SELECT * FROM audit_log WHERE table_name = $1 AND record_id = $2 ORDER BY changed_at DESC LIMIT 10', ['customer_order', Number(id)])
  ]);

  // যদি আইডি দিয়ে কোনো অর্ডার না পাওয়া যায়, তবে নেক্সট.জেএস-এর 404 পেজে রিডাইরেক্ট (Redirect) করা হবে।
  if (orderRes.rows.length === 0) notFound();
  const orderBase = orderRes.rows[0];

  // ২. ডিপেন্ডেন্ট ডেটা ফেচিং (Dependent Data Fetching / Scatter-Gather Pattern):
  // বেস অর্ডারের আইডির উপর ভিত্তি করে রিলেশনাল ডেটাগুলো (Relational Data) ফেচ করা হচ্ছে।
  // এখানেও 'Promise.all' ব্যবহার করায় ল্যাটেন্সি অনেক কম হবে।
  const [
    customerRes, itemsRes, paymentsRes, invoiceRes,
    shipmentRes, courierRes, addressRes, returnsRes
  ] = await Promise.all([
    db.query('SELECT name, email, phone FROM customer WHERE customer_id = $1', [orderBase.customer_id]),
    // অর্ডার আইটেমগুলোর সাথে প্রোডাক্ট এবং ভ্যারিয়েন্টের ডেটা JOIN করা হচ্ছে।
    db.query(`
      SELECT i.*, 
             p.name as product_name, p.product_code as product_code,
             v.color as variant_color, v.size as variant_size, v.sku as variant_sku
      FROM order_item i
      JOIN product p ON i.product_id = p.product_id
      LEFT JOIN product_variant v ON i.code = v.variant_code
      WHERE i.order_id = $1
    `, [orderBase.order_id]),
    db.query('SELECT * FROM payment WHERE order_id = $1', [orderBase.order_id]),
    db.query('SELECT * FROM invoice WHERE order_id = $1', [orderBase.order_id]),
    db.query('SELECT * FROM shipment WHERE order_id = $1', [orderBase.order_id]),
    // কন্ডিশনাল কুয়েরি (Conditional Query): যদি কুরিয়ার আইডি বা অ্যাড্রেস আইডি না থাকে, তবে ডামি প্রমিস রিটার্ন করা হয়।
    orderBase.courier_id ? db.query('SELECT * FROM courier WHERE courier_id = $1', [orderBase.courier_id]) : Promise.resolve({ rows: [] }),
    orderBase.shipping_address_id ? db.query('SELECT * FROM address WHERE address_id = $1', [orderBase.shipping_address_id]) : Promise.resolve({ rows: [] }),
    // রিটার্ন রিকোয়েস্ট (যদি থাকে)
    db.query(`
      SELECT r.*, p.name as product_name
      FROM return_request r
      JOIN order_item i ON r.order_item_id = i.order_item_id
      JOIN product p ON i.product_id = p.product_id
      WHERE i.order_id = $1
    `, [orderBase.order_id])
  ]);

  // ৩. ডেটা অ্যাগ্রিগেশন (Data Aggregation):
  // বিক্ষিপ্ত (Scattered) রিলেশনাল ডেটাগুলোকে একটি সিঙ্গল নেস্টেড অবজেক্টে (Nested Object) রূপান্তর করা হচ্ছে।
  const order = {
    ...orderBase,
    customer: customerRes.rows[0],
    items: itemsRes.rows.map(row => ({
      ...row,
      product: { name: row.product_name, product_code: row.product_code },
      variant: row.variant_sku ? { color: row.variant_color, size: row.variant_size, sku: row.variant_sku } : null
    })),
    payments: paymentsRes.rows,
    invoice: invoiceRes.rows[0] || null,
    shipment: shipmentRes.rows[0] || null,
    courier: courierRes.rows[0] || null,
    shipping_address: addressRes.rows[0] || null,
    return_requests: returnsRes.rows.map(row => ({
      ...row,
      product: { name: row.product_name }
    }))
  };

  const couriers = couriersRes.rows;
  const auditLogs = auditLogsRes.rows;

  // ৪. ইউজার ইন্টারফেস (User Interface - UI):
  return (
    <div>
      {/* হেডার (Header) */}
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
        {/* বর্তমান স্ট্যাটাস ব্যাজ */}
        <OrderStatusBadge status={order.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        {/* বাম কলাম (Left Column): বিস্তারিত তথ্য (Details) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* কাস্টমার ইনফো (Customer Info) */}
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

          {/* অর্ডার আইটেম (Items) */}
          <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 20 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> Order Items</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Product", "SKU", "Variant", "Qty", "Unit Price", "Total"].map(h => (
                    <th key={h} style={{ padding: "8px 0", textAlign: "left", fontSize: 11, color: "rgba(255,255,255,0.35)", borderBottom: "1px solid rgba(255,255,255,0.05)", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: any) => (
                  <tr key={item.order_item_id}>
                    <td style={{ padding: "10px 0", color: "white", fontSize: 13, fontWeight: 500, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{item.product.name}</td>
                    <td style={{ padding: "10px 0", color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "monospace", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{item.variant?.sku ?? item.product.product_code}</td>
                    <td style={{ padding: "10px 0", color: "rgba(255,255,255,0.5)", fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      {item.variant ? `${item.variant.color ?? ""}${item.variant.size ? " / " + item.variant.size : ""}` : "—"}
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

            {/* ফাইন্যান্সিয়াল টোটালস (Totals) */}
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

          {/* শিপমেন্ট ইনফো (Shipment + Audit) */}
          {order.shipment && (
            <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 16 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="15" height="13" x="1" y="3" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> Shipment</h2>
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

          {/* অডিট লগ (Audit Log) - নিরাপত্তার খাতিরে কে কখন স্ট্যাটাস চেঞ্জ করেছে তার লগ */}
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

        {/* ডান কলাম (Right Column) — অ্যাকশনস এবং অন্যান্য মেটাডেটা (Actions) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* এই কম্পোনেন্ট থেকে স্ট্যাটাস পরিবর্তন এবং কুরিয়ার অ্যাসাইন করার সার্ভার অ্যাকশন কল করা হয় */}
          <AdminOrderActions
            orderId={order.order_id}
            status={order.status}
            couriers={couriers.map(c => ({ courier_id: c.courier_id, name: c.name }))}
            currentCourierId={order.courier_id}
          />

          {/* রিটার্ন রিকোয়েস্ট (Return Requests) */}
          {order.return_requests.length > 0 && (
            <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "#f87171", fontSize: 16, marginBottom: 16 }}>↩️ Return Requests</h2>
              {order.return_requests.map((rr: any) => (
                <div key={rr.return_id} style={{ padding: 12, background: "rgba(239,68,68,0.05)", borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{rr.product.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>{rr.reason}</div>
                  <div style={{ marginTop: 8 }}><OrderStatusBadge status={rr.status} /></div>
                </div>
              ))}
            </div>
          )}

          {/* শিপিং অ্যাড্রেস (Shipping Address) */}
          {order.shipping_address && (
            <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 12 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> Shipping Address</h2>
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

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/admin/orders/[id]/page.tsx`) ই-কমার্স সিস্টেমের ব্যাকঅফিস বা অ্যাডমিনের জন্য একটি সুনির্দিষ্ট অর্ডারের বিস্তারিত ভিউ (Detailed View) বা "সিঙ্গেল সোর্স অফ ট্রুথ (Single Source of Truth)" প্রদান করে। এটি একটি সার্ভার-সাইড রেন্ডারড (SSR) কম্পোনেন্ট যা স্ক্যাটার-গ্যাদার (Scatter-Gather) প্যাটার্ন অনুসরণ করে। প্রথমে প্রাইমারি বা বেস ডেটা (যেমন অর্ডারের মূল তথ্য) ফেচ করা হয়, এবং তারপর তার উপর ভিত্তি করে অন্যান্য রিলেশনাল ডেটা (যেমন আইটেম, পেমেন্ট, ইনভয়েস, শিপমেন্ট) প্যারালালি ফেচ করা হয়। এরপর ডেটা ট্রান্সফরমেশন (Data Transformation) এর মাধ্যমে সব ডেটাকে একটি অবজেক্ট গ্রাফে (Object Graph) অ্যাগ্রিগেট করে UI তে রেন্ডার করা হয়।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
যদিও এখানে সরাসরি `requireAdmin()` ইনভোক করা হয়নি, তবে অ্যাডমিন লেআউটের কারণে এই পেজটি শুধুমাত্র ভ্যালিড অ্যাডমিন সেশনধারী ব্যবহারকারীদের জন্য উন্মুক্ত। ডায়নামিক রাউট প্যারামিটার (`id`) ডাটাবেস কুয়েরিতে ইনজেক্ট করার সময় `Number(id)` দিয়ে কাস্ট (Cast) করা হয়েছে এবং প্যারামিটারাইজড কুয়েরি (`$1`) ব্যবহার করা হয়েছে। এটি এসকিউএল ইনজেকশন (SQL Injection) প্রতিরোধের জন্য একটি নিশ্ছিদ্র মেকানিজম। 

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই পেজটিতে একটি উল্লেখযোগ্য ফিচার হলো "অডিট লগ (Audit Log)" এর অন্তর্ভুক্তি। ই-কমার্স অ্যাডমিন প্যানেলে ট্র্যাকিং (Tracking) এবং জবাবদিহিতা (Accountability) খুবই জরুরি। `audit_log` টেবিল থেকে ডেটা ফেচ করে UI তে রেন্ডার করা হয়, যার ফলে কোন অ্যাডমিন কখন অর্ডারের স্ট্যাটাস বা কুরিয়ার পরিবর্তন করেছে তা সুস্পষ্টভাবে দেখা যায়। অর্ডারের স্ট্যাটাস পরিবর্তনের জন্য `AdminOrderActions` ক্লায়েন্ট কম্পোনেন্টটি ব্যবহার করা হয়, যা সার্ভার অ্যাকশনগুলো (যেমন `assignCourierAction`, `approveCourierAction`) কল করার মাধ্যমে ডেটাবেস মিউটেশন (Mutation) ঘটায়। মিউটেশনের পর `revalidatePath` এর কারণে এই পেজটি রিফ্রেশ হয়ে সর্বশেষ ডেটা প্রদর্শন করে।
================================================================================
*/
