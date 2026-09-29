// এসইও (SEO) এর জন্য মেটাডেটা টাইপ।
import { Metadata } from "next";
// যদি ডেটাবেসে কোনো রেকর্ড না পাওয়া যায়, তবে 404 পেইজ রেন্ডার করার জন্য।
import { notFound } from "next/navigation";
// ক্লায়েন্ট-সাইড নেভিগেশনের জন্য 'Link' কম্পোনেন্ট।
import Link from "next/link";
// প্রমাণীকরণ এবং অ্যাক্সেস কন্ট্রোলের জন্য।
import { requireCustomer } from "@/lib/auth";
// সরাসরি ডেটাবেস সংযোগের জন্য।
import { db } from "@/lib/db";
// অর্ডারের স্ট্যাটাস অনুযায়ী ভিন্ন রঙের ব্যাজ দেখানোর কম্পোনেন্ট।
import OrderStatusBadge from "@/components/OrderStatusBadge";
// ক্লায়েন্ট-সাইড ইন্টারঅ্যাকশনের জন্য (অর্ডার বাতিল এবং রিটার্ন রিকোয়েস্ট) বাটন এবং ফর্ম।
import { CancelOrderButton, ReturnRequestForm } from "./OrderActions";

// ─── মেটাডেটা (Metadata) ──────────────────────────────────────────────────────────
export const metadata: Metadata = { title: "Order Details — NodeCommerce" };

// নেক্সট.জেএস (Next.js) ১৩+ এ ডায়নামিক রাউট (Dynamic Route) এর প্যারামিটার টাইপ।
type Props = { params: Promise<{ id: string }> };

// ─── সার্ভার কম্পোনেন্ট (Server Component) ──────────────────────────────
// নির্দিষ্ট অর্ডারের বিস্তারিত তথ্য (Order Details) দেখানোর জন্য এটি একটি সার্ভার-সাইড কম্পোনেন্ট।
export default async function OrderDetailPage({ params }: Props) {
  // ১. প্যারামিটার এক্সট্রাকশন (Parameter Extraction): URL থেকে 'id' নেওয়া হচ্ছে।
  const { id } = await params;
  // ২. অ্যাক্সেস কন্ট্রোল (Access Control): সেশন চেক করা হচ্ছে।
  const session = await requireCustomer();

  // ৩. প্রাইমারি ডেটা ফেচিং এবং ভ্যালিডেশন (Primary Data Fetching & Validation):
  // প্রথমে নিশ্চিত করা হচ্ছে যে, এই অর্ডারটি সত্যিই এই কাস্টমারের (IDOR Prevention)।
  const orderRes = await db.query('SELECT * FROM customer_order WHERE order_id = $1 AND customer_id = $2', [Number(id), session.id]);
  
  // যদি অর্ডার না থাকে বা অন্য কারো হয়, তবে 404 Not Found থ্রো (Throw) করা হবে।
  if (orderRes.rows.length === 0) notFound();
  const orderBase = orderRes.rows[0];

  // ৪. কনকারেন্ট রিলেশনাল ডেটা ফেচিং (Concurrent Relational Data Fetching):
  // অর্ডারের সাথে সম্পর্কিত সকল ডেটা (Items, Payments, Invoice, Shipment, Courier, Address, Returns) 
  // 'Promise.all' ব্যবহার করে সমান্তরালভাবে (In Parallel) আনা হচ্ছে। 
  // এতে করে ওয়াটারফল ইফেক্ট (Waterfall Effect) রোধ হয় এবং রেসপন্স টাইম কমে।
  const [
    itemsRes, paymentsRes, invoiceRes,
    shipmentRes, courierRes, addressRes, returnsRes
  ] = await Promise.all([
    // অর্ডার আইটেম, প্রোডাক্ট এবং ভ্যারিয়েন্টের ডেটা একত্রে আনা হচ্ছে (JOIN)।
    db.query(`
      SELECT i.*, 
             p.name as product_name, p.product_code as product_code,
             v.color as variant_color, v.size as variant_size, v.sku as variant_sku
      FROM order_item i
      JOIN product p ON i.product_id = p.product_id
      LEFT JOIN product_variant v ON i.code = v.variant_code
      WHERE i.order_id = $1
    `, [orderBase.order_id]),
    // পেমেন্ট হিস্ট্রি।
    db.query('SELECT * FROM payment WHERE order_id = $1', [orderBase.order_id]),
    // ইনভয়েস বা ভ্যাট/ট্যাক্স সম্পর্কিত তথ্য।
    db.query('SELECT * FROM invoice WHERE order_id = $1', [orderBase.order_id]),
    // শিপমেন্ট এবং ট্র্যাকিং (Tracking) তথ্য।
    db.query('SELECT * FROM shipment WHERE order_id = $1', [orderBase.order_id]),
    // যদি কুরিয়ার আইডি থাকে, তবে কুরিয়ারের তথ্য আনা হচ্ছে, অন্যথায় এম্পটি প্রমিস (Empty Promise)।
    orderBase.courier_id ? db.query('SELECT * FROM courier WHERE courier_id = $1', [orderBase.courier_id]) : Promise.resolve({ rows: [] }),
    // ডেলিভারি ঠিকানা আনা হচ্ছে।
    orderBase.shipping_address_id ? db.query('SELECT * FROM address WHERE address_id = $1', [orderBase.shipping_address_id]) : Promise.resolve({ rows: [] }),
    // এই অর্ডারের জন্য কোনো রিটার্ন রিকোয়েস্ট আছে কিনা তা চেক করা হচ্ছে।
    db.query('SELECT * FROM return_request WHERE order_id = $1', [orderBase.order_id])
  ]);

  // ৫. ডেটা অ্যাগ্রিগেশন ও ট্রান্সফরমেশন (Data Aggregation & Transformation):
  // ভিন্ন ভিন্ন কুয়েরি থেকে প্রাপ্ত ডেটাগুলোকে একটি মাত্র 'order' অবজেক্টে একত্রিত করা হচ্ছে, 
  // যাতে ফ্রন্টএন্ডে রেন্ডার করা সহজ হয়।
  const order = {
    ...orderBase,
    items: itemsRes.rows.map(row => ({
      ...row,
      product: { product_id: row.product_id, name: row.product_name, product_code: row.product_code },
      variant: row.variant_sku ? { color: row.variant_color, size: row.variant_size, sku: row.variant_sku } : null
    })),
    payments: paymentsRes.rows,
    invoice: invoiceRes.rows[0] || null,
    shipment: shipmentRes.rows[0] || null,
    courier: courierRes.rows[0] || null,
    shipping_address: addressRes.rows[0] || null,
    return_requests: returnsRes.rows
  };

  // ৬. স্টেট মেশিন কনফিগারেশন (State Machine Configuration):
  // অর্ডারের লাইফসাইকেল বা স্ট্যাটাসের ক্রমানুসারে (Sequential Progression) একটি অ্যারে।
  const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
  // বর্তমান স্ট্যাটাসের ইনডেক্স বের করা হচ্ছে প্রগ্রেস বার (Progress Bar) দেখানোর জন্য।
  const currentStep = steps.indexOf(order.status);

  // ৭. ইউজার ইন্টারফেস (User Interface - UI):
  return (
    <div>
      {/* হেডার (Header): ব্যাক বাটন, অর্ডার আইডি এবং তারিখ */}
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

      {/* প্রগ্রেস স্টেপার (Progress Stepper): অর্ডার বাতিল না হলে এটি প্রদর্শিত হবে */}
      {order.status !== "cancelled" && (
        <div style={{
          background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20, padding: 28, marginBottom: 24,
        }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 24 }}>
            Order Progress
          </h2>
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* ডায়নামিক প্রগ্রেস বার রেন্ডারিং */}
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
                  {/* কানেক্টিং লাইন (Connecting Line) */}
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

      {/* গ্রিড লেআউট (Grid Layout) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* অর্ডারকৃত আইটেমসমূহ (Items Ordered) */}
        <div style={{
          background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20, padding: 24,
        }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 20 }}>
            Items Ordered
          </h2>
          {order.items.map((item: any) => (
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
                {/* অর্ডার ডেলিভার্ড (Delivered) হলে রিটার্ন রিকোয়েস্ট ফর্ম দেখানো হবে */}
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

        {/* সামারি এবং শিপিং (Summary & Shipping) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* হিসাব-নিকাশ (Financial Totals) */}
          <div style={{
            background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: 24,
          }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 16 }}>
              Summary
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* ডায়নামিক বিলিং রো (Dynamic Billing Rows) */}
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

          {/* পেমেন্ট ইনফরমেশন (Payment Information) */}
          <div style={{
            background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: 20,
          }}>
            <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 15, marginBottom: 12 }}>Payment</h3>
            {order.payments.map((p: any) => (
              <div key={p.payment_id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.method.toUpperCase()}</span>
                <OrderStatusBadge status={p.status} />
              </div>
            ))}
          </div>

          {/* ডেলিভারির ঠিকানা (Shipping Address) */}
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

      {/* অর্ডার ক্যানসেল বাটন (Cancel Order Action) */}
      {order.status === "pending" && (
        <div style={{
          background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)",
          borderRadius: 16, padding: 20,
        }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginBottom: 12 }}>
            This order can still be cancelled.
          </p>
          {/* ক্লায়েন্ট কম্পোনেন্ট ব্যবহার করা হচ্ছে, যা 'cancelOrderAction' ইনভোক করবে */}
          <CancelOrderButton orderId={order.order_id} />
        </div>
      )}
    </div>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/account/orders/[id]/page.tsx`) একটি অর্ডার ম্যানেজমেন্ট সিস্টেমের (Order Management System - OMS) একটি আদর্শ উদাহরণ। এটি ডায়নামিক রাউটিং (Dynamic Routing) এর মাধ্যমে কাজ করে। এর মূল স্থাপত্য হলো "Scatter-Gather" প্যাটার্ন। প্রথমে একটি সিকুয়েনশিয়াল (Sequential) কুয়েরির মাধ্যমে মূল অর্ডারের অস্তিত্ব যাচাই করা হয়। এরপর পারফরম্যান্স অপ্টিমাইজেশনের (Performance Optimization) জন্য `Promise.all` ব্যবহার করে ৭টি আলাদা রিলেশনাল টেবিল (Items, Payments, Invoice, Shipment, Courier, Address, Return Request) থেকে সমান্তরালভাবে (Concurrently) ডেটা ফেচ করা হয়। এরপর এই বিক্ষিপ্ত (Scattered) ডেটাগুলোকে একটি নির্দিষ্ট অবজেক্টে একত্রিত (Gather) করে UI-তে পাঠানো হয়।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
অ্যাক্সেস কন্ট্রোল (Access Control) এখানে অত্যন্ত নিবিড়ভাবে প্রয়োগ করা হয়েছে। `requireCustomer()` এর মাধ্যমে যেমন ব্রড-লেভেল (Broad-level) অথেনটিকেশন চেক করা হয়, তেমনি ডাটাবেস কুয়েরিতে `customer_id = session.id` এর মাধ্যমে অবজেক্ট-লেভেল (Object-level) অথরাইজেশন নিশ্চিত করা হয়। এটি আইডিএম (Identity Management) এর একটি কোর প্রিন্সিপাল যা ইনসিকিউর ডাইরেক্ট অবজেক্ট রেফারেন্স (IDOR) দুর্বলতা সম্পূর্ণভাবে রোধ করে।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই পেজের ডেটা ফ্লো অত্যন্ত কাঠামোগত। সার্ভার ডেটা ফেচ করে এবং UI এর বিভিন্ন ব্লকে ডিস্ট্রিবিউট করে। এছাড়া এখানে অর্ডার লাইফসাইকেলের (Order Lifecycle) উপর ভিত্তি করে কন্ডিশনাল রেন্ডারিং (Conditional Rendering) ব্যবহার করা হয়েছে। উদাহরণস্বরূপ, যদি অর্ডারের স্ট্যাটাস 'pending' হয়, তবেই 'CancelOrderButton' ক্লায়েন্ট কম্পোনেন্টটি ইনজেক্ট করা হয়। আবার যদি স্ট্যাটাস 'delivered' হয়, তবে 'ReturnRequestForm' ইনজেক্ট করা হয়। এই ফর্মগুলো পরবর্তীতে Next.js Server Actions কল করে ডেটাবেসে মিউটেশন (Mutation) ঘটায়।
================================================================================
*/
