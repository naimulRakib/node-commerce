import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import PrintButton from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "Order Confirmed — NodeCommerce",
  description: "Your order has been placed successfully.",
};

type Props = { params: Promise<{ orderId: string }> };

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderId } = await params;
  const session = await requireCustomer();

  const orderRes = await db.query('SELECT * FROM customer_order WHERE order_id = $1 AND customer_id = $2', [Number(orderId), session.id]);
  if (orderRes.rows.length === 0) notFound();
  const orderBase = orderRes.rows[0];

  const [itemsRes, shipmentRes, courierRes, invoiceRes, addressRes, paymentRes] = await Promise.all([
    db.query(`
      SELECT i.*, p.name as product_name, v.color as variant_color, v.size as variant_size
      FROM order_item i
      JOIN product p ON i.product_id = p.product_id
      LEFT JOIN product_variant v ON i.code = v.variant_code
      WHERE i.order_id = $1
    `, [orderBase.order_id]),
    db.query('SELECT * FROM shipment WHERE order_id = $1', [orderBase.order_id]),
    orderBase.courier_id ? db.query('SELECT name FROM courier WHERE courier_id = $1', [orderBase.courier_id]) : Promise.resolve({ rows: [] }),
    db.query('SELECT * FROM invoice WHERE order_id = $1', [orderBase.order_id]),
    orderBase.shipping_address_id ? db.query('SELECT * FROM address WHERE address_id = $1', [orderBase.shipping_address_id]) : Promise.resolve({ rows: [] }),
    db.query('SELECT * FROM payment WHERE order_id = $1', [orderBase.order_id])
  ]);

  const order = {
    ...orderBase,
    items: itemsRes.rows.map(row => ({
      ...row,
      line_total: Number(row.unit_price) * row.quantity,
      product: { name: row.product_name },
      variant: row.variant_color || row.variant_size ? { color: row.variant_color, size: row.variant_size } : null
    })),
    shipment: shipmentRes.rows[0] || null,
    courier: courierRes.rows[0] || null,
    invoice: invoiceRes.rows[0] || null,
    shipping_address: addressRes.rows[0] || null,
    payment: paymentRes.rows[0] || null
  };

  if (!order) notFound();

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "100vh" }}>
        <div className="container" style={{ padding: "60px 24px", maxWidth: 760 }}>
          {/* Success Header */}
          <div className="success-header" style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40, margin: "0 auto 20px",
            }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
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

          {/* Official Invoice / Receipt */}
          <div className="invoice-box" style={{
            background: "white", color: "#1a1a2e",
            borderRadius: 16, padding: 40, marginBottom: 24,
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            position: "relative", overflow: "hidden"
          }}>
            {/* Invoice Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, borderBottom: "2px dashed #e2e8f0", paddingBottom: 24 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "Outfit, sans-serif", color: "#1a1a2e", marginBottom: 4 }}>
                  INVOICE
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Order ID: <b>#{order.order_id}</b></div>
                {order.invoice?.invoice_id && (
                  <div style={{ fontSize: 13, color: "#64748b" }}>Invoice No: <b>INV-{order.invoice.invoice_id}</b></div>
                )}
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  Date: {new Date(order.order_date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`ORDER:#${order.order_id}|TOTAL:Tk${order.total_amount}|STATUS:${order.status}|TXID:${order.payment?.txid || 'N/A'}`)}`}
                  alt="QR Code" 
                  style={{ width: 80, height: 80, marginBottom: 8, border: "4px solid white", borderRadius: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
                />
                <OrderStatusBadge status={order.status} />
              </div>
            </div>

            {/* Billing & Payment Info */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 8 }}>Billed To</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{session.name || "Customer"}</div>
                {order.shipping_address && (
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginTop: 4, maxWidth: 200 }}>
                    {order.shipping_address.address_line1}<br />
                    {order.shipping_address.city} {order.shipping_address.district && `, ${order.shipping_address.district}`}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 8 }}>Payment Info</div>
                {order.payment ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", textTransform: "uppercase" }}>{order.payment.method}</div>
                    <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
                      Status: <span style={{ color: order.payment.status === "success" ? "#16a34a" : "#ca8a04", fontWeight: 600 }}>{order.payment.status.toUpperCase()}</span>
                    </div>
                    {order.payment.txid && (
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, fontFamily: "monospace" }}>TX: {order.payment.txid}</div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "#475569" }}>Processing...</div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", borderBottom: "2px solid #e2e8f0", paddingBottom: 8, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Item Description</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "right" }}>Price</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "center" }}>Qty</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "right" }}>Total</div>
              </div>
              
              {order.items.map((item: any) => (
                <div key={item.order_item_id} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{item.product.name}</div>
                    {item.variant && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        {item.variant.color && `${item.variant.color}`}
                        {item.variant.size && ` • ${item.variant.size}`}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: "#475569", textAlign: "right" }}>৳{Number(item.unit_price).toLocaleString()}</div>
                  <div style={{ fontSize: 14, color: "#475569", textAlign: "center" }}>{item.quantity}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", textAlign: "right" }}>৳{Number(item.line_total).toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: 250, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#475569" }}>
                  <span>Subtotal</span>
                  <span>৳{Number(order.subtotal).toLocaleString()}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#16a34a" }}>
                    <span>Discount</span>
                    <span>−৳{Number(order.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#475569" }}>
                  <span>Shipping</span>
                  <span>{Number(order.shipping_fee) === 0 ? "FREE" : `৳${Number(order.shipping_fee)}`}</span>
                </div>
                {order.invoice && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#475569" }}>
                    <span>VAT ({Number(order.invoice.tax_rate)}%)</span>
                    <span>৳{Number(order.invoice.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ height: 2, background: "#e2e8f0", margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Total Paid</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#2563eb" }}>৳{Number(order.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Print Button (Client side wrapper) */}
            <div style={{ marginTop: 40, textAlign: "center" }}>
              <PrintButton />
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                nav, footer, .print-btn, .btn-primary, .btn-secondary, .success-header { display: none !important; }
                main { padding: 0 !important; }
                .container { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
                .invoice-box { box-shadow: none !important; border: none !important; border-radius: 0 !important; padding: 0 !important; }
              }
            `}} />
          </div>

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


/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি নেক্সট.জেএস (Next.js) অ্যাপ রাউটারের (App Router) একটি রুট পেজ (Page Component)। ফোল্ডার স্ট্রাকচারের উপর ভিত্তি করে নেক্সট.জেএস স্বয়ংক্রিয়ভাবে এর রাউটিং (File-system based Routing) তৈরি করে। এটি সাধারণত একটি সার্ভার কম্পোনেন্ট (Server Component), যা ব্রাউজারে যাওয়ার আগেই সার্ভারে রেন্ডার (SSR) হয়।

২. লজিক ও ডেটা ফ্লো (Logic & Data Flow):
- পেজ কম্পোনেন্টগুলো সরাসরি ডেটাবেস বা এক্সটার্নাল API থেকে ডেটা ফেচ (Fetch) করতে পারে, কারণ এগুলো সার্ভারে রান হয়।
- প্রপস হিসেবে এটি রাউটের 'params' (যেমন: /products/[id]) এবং 'searchParams' (যেমন: ?page=2) গ্রহণ করে।
- ডেটা ফেচিং শেষে এটি UI রেন্ডার করে ক্লায়েন্টে পাঠায়।

৩. ব্যবহারিক গুরুত্ব (Practical Significance):
সার্ভার-সাইড রেন্ডারিংয়ের ফলে ফার্স্ট কন্টেন্টফুল পেইন্ট (First Contentful Paint) ফাস্ট হয় এবং সার্চ ইঞ্জিন অপটিমাইজেশন (SEO) অত্যন্ত ভালো হয়।
================================================================================
*/
