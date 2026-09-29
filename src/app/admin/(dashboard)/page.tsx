// এসইও (SEO) এর জন্য নেক্সট.জেএস এর বিল্ট-ইন মেটাডেটা ইন্টারফেস।
import { Metadata } from "next";
// ক্লায়েন্ট-সাইড নেভিগেশনের জন্য লিঙ্ক কম্পোনেন্ট।
import Link from "next/link";
import { db } from "@/lib/db";
import OrderStatusBadge from "@/components/OrderStatusBadge";

// ─── মেটাডেটা (Metadata) ──────────────────────────────────────────────────────────
export const metadata: Metadata = { title: "Admin Dashboard — NodeCommerce" };

// ─── মূল সার্ভার কম্পোনেন্ট (Main Server Component) ──────────────────────────────
export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalOrdersRes, pendingOrdersRes, totalRevenueRes, totalCustomersRes,
    lowStockVariantsRes, recentOrdersRaw,
  ] = await Promise.all([
    db.query("SELECT COUNT(*) FROM customer_order"),
    db.query("SELECT COUNT(*) FROM customer_order WHERE status = 'pending'"),
    db.query("SELECT SUM(total_amount) FROM customer_order WHERE status IN ('delivered', 'shipped', 'processing', 'confirmed')"),
    db.query("SELECT COUNT(*) FROM customer"),
    db.query("SELECT COUNT(*) FROM product_variant WHERE quantity <= 5 AND quantity > 0"),
    db.query(`
      SELECT o.order_id, o.total_amount, o.status, o.order_date, c.name as customer_name, COUNT(i.order_item_id) as items_count
      FROM customer_order o
      LEFT JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN order_item i ON o.order_id = i.order_id
      GROUP BY o.order_id, c.name
      ORDER BY o.order_date DESC
      LIMIT 8
    `)
  ]);

  const totalOrders = Number(totalOrdersRes.rows[0]?.count || 0);
  const pendingOrders = Number(pendingOrdersRes.rows[0]?.count || 0);
  const totalRevenue = Number(totalRevenueRes.rows[0]?.sum || 0);
  const totalCustomers = Number(totalCustomersRes.rows[0]?.count || 0);
  const lowStockVariants = Number(lowStockVariantsRes.rows[0]?.count || 0);
  const recentOrders = recentOrdersRaw.rows.map(o => ({
    order_id: o.order_id,
    total_amount: o.total_amount,
    status: o.status as string,
    customer_name: o.customer_name || "Unknown",
    items_count: Number(o.items_count || 0)
  }));

  const stats = [
    { label: "Total Orders", value: totalOrders, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>, color: "#eab308", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)" },
    { label: "Pending Orders", value: pendingOrders, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, color: "#60a5fa", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" },
    { label: "Total Revenue", value: `৳${totalRevenue.toLocaleString()}`, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, color: "#4ade80", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)" },
    { label: "Total Customers", value: totalCustomers, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, color: "#c084fc", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)" },
  ];

  // ৪. ইউজার ইন্টারফেস রেন্ডারিং (User Interface Rendering):
  return (
    <div>
      {/* পেইজ হেডার (Page Header) */}
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 4 }}>
        Dashboard
      </h1>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 32 }}>
        {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>

      {/* স্ট্যাটস গ্রিড (Stats Grid): মূল পারফরম্যান্স ইন্ডিকেটরসমূহ (Key Performance Indicators - KPIs) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{
            background: stat.bg, border: `1px solid ${stat.border}`,
            borderRadius: 20, padding: "24px 20px",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{stat.icon}</div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* লো-স্টক অ্যালার্ট (Low Stock Alert): শর্তসাপেক্ষ রেন্ডারিং (Conditional Rendering) */}
      {lowStockVariants > 0 && (
        <div style={{
          background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)",
          borderRadius: 16, padding: "14px 20px", marginBottom: 28,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 22 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg></span>
          <div>
            <span style={{ color: "#eab308", fontWeight: 600 }}>{lowStockVariants} product variants</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}> are running low on stock (≤ 5 units)</span>
          </div>
          <Link href="/admin/products" style={{ marginLeft: "auto", color: "#eab308", fontSize: 13, textDecoration: "none" }}>
            Manage Inventory →
          </Link>
        </div>
      )}

      {/* সাম্প্রতিক অর্ডারের টেবিল (Recent Orders Table) */}
      <div style={{
        background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20, overflow: "hidden",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18 }}>
            Recent Orders
          </h2>
          <Link href="/admin/orders" style={{ color: "#eab308", fontSize: 13, textDecoration: "none" }}>View All →</Link>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              {/* টেবিল হেডারস (Table Headers) ডায়নামিকভাবে জেনারেট করা হচ্ছে */}
              {["Order ID", "Customer", "Items", "Total", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* ডেটা রো (Data Rows) */}
            {recentOrders.map((order, i) => (
              <tr key={order.order_id} style={{ borderBottom: i < recentOrders.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ fontFamily: "monospace", color: "#eab308", fontWeight: 700 }}>#{order.order_id}</span>
                </td>
                <td style={{ padding: "14px 20px", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                  {order.customer_name}
                </td>
                <td style={{ padding: "14px 20px", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                  {order.items_count}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
                    ৳{Number(order.total_amount).toLocaleString()}
                  </span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  {/* স্ট্যাটাস অনুযায়ী ডায়নামিক ব্যাজ */}
                  <OrderStatusBadge status={order.status} />
                </td>
                <td style={{ padding: "14px 20px" }}>
                  {/* অর্ডার ম্যানেজমেন্ট পেজে যাওয়ার লিংক */}
                  <Link href={`/admin/orders/${order.order_id}`} style={{
                    fontSize: 13, color: "#eab308", textDecoration: "none",
                    padding: "5px 12px", borderRadius: 8,
                    background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)",
                  }}>Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/admin/page.tsx`) ই-কমার্স সিস্টেমের ব্যাকঅফিস বা অ্যাডমিন প্যানেলের (Admin Panel) মূল ড্যাশবোর্ড (Dashboard) হিসেবে কাজ করে। এটি একটি সার্ভার-সাইড রেন্ডারড (SSR) কম্পোনেন্ট। এর প্রধান কাজ হলো সিস্টেমের সার্বিক স্বাস্থ্য (System Health) এবং পারফরম্যান্স মেট্রিক্স (Performance Metrics) এক নজরে প্রদর্শন করা। পারফরম্যান্স অপ্টিমাইজেশনের জন্য এখানে `Promise.all` ব্যবহার করে কনকারেন্ট কুয়েরি এক্সিকিউশন (Concurrent Query Execution) এর মেকানিজম প্রয়োগ করা হয়েছে। ফলে, ৬টি আলাদা কুয়েরি সিরিয়ালি এক্সিকিউট না হয়ে প্যারালালি এক্সিকিউট হয়, যা ওভারঅল লেটেন্সি (Overall Latency) উল্লেখযোগ্যভাবে কমিয়ে দেয়।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
যদিও এই ফাইলে সরাসরি `requireAdmin()` ইনভোক করা হয়নি, তবে অ্যাডমিন লেআউট (`src/app/admin/layout.tsx` - যদি থাকে) অথবা মিডলওয়্যারের (Middleware) মাধ্যমে এই রাউটটি সুরক্ষিত থাকার কথা। ডেটাবেস কুয়েরিগুলোতে কোনো ইউজার ইনপুট না থাকায় এসকিউএল ইনজেকশনের (SQL Injection) কোনো ঝুঁকি নেই। 

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই পেজটিতে সম্পূর্ণ উপাত্ত প্রবাহ (Data Flow) সার্ভার-সাইডেই নিয়ন্ত্রিত হয়। ডেটাবেস থেকে অ্যাগ্রিগেটেড ডেটা (Aggregated Data - COUNT, SUM) ফেচ করে সেগুলোকে সরাসরি HTML এ রেন্ডার করে ক্লায়েন্টের কাছে পাঠানো হয়। এটি ড্যাশবোর্ডের মতো ডেটা-ইনটেনসিভ (Data-intensive) পেজের জন্য একটি আদর্শ আর্কিটেকচার, কারণ এটি ক্লায়েন্ট-সাইড জাভাস্ক্রিপ্ট বান্ডেল সাইজ (Bundle Size) ছোট রাখে এবং ইনিশিয়াল পেজ লোড টাইম (Initial Page Load Time) ফাস্ট করে।
================================================================================
*/
