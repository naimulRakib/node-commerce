// এসইও (SEO) এর জন্য মেটাডেটা ইন্টারফেস।
import { Metadata } from "next";
// ডাটাবেস কানেকশন পুল।
import { db } from "@/lib/db";

// ─── মেটাডেটা (Metadata) ───────────────────────────────────────────────────
export const metadata: Metadata = { title: "Analytics — Admin" };

// সার্ভার সাইডে এই পেজটি রিফ্রেশ করা হবে (ক্যাশ ডিজেবল)
export const dynamic = "force-dynamic";

// ─── PSS ফর্মুলা: Product Strength Score (পণ্য শক্তি স্কোর) ─────────────
// ami naimul — এটা আমার নিজের ফর্মুলা বানিয়েছি
// বিভিন্ন ফ্যাক্টর মিলিয়ে একটা প্রোডাক্টের সার্বিক পারফরম্যান্স বোঝানো হয়
function calcPSS(product: any) {
  // বিক্রির পরিমাণ সবচেয়ে গুরুত্বপূর্ণ (৪০%)
  const salesScore = (Number(product.total_qty_sold) || 0) * 0.4;

  // রেটিং — ৫ স্টার হলে ম্যাক্স ২৫ পয়েন্ট (২৫%)
  const ratingScore = (parseFloat(product.avg_rating) || 0) * 20 * 0.25;

  // রেভিনিউ — বড় টাকার প্রোডাক্টের জন্য (২০%)
  const revenueScore = (parseFloat(product.total_revenue) || 0) * 0.0001 * 0.2;

  // রিভিউ সংখ্যা — মানুষ পড়ে কিনলে ভালো (১৫%)
  const reviewScore = (Number(product.review_count) || 0) * 0.15;

  const raw = salesScore + ratingScore + revenueScore + reviewScore;
  // সর্বোচ্চ ১০০ পয়েন্ট, মিনিমাম ০
  return Math.min(100, Math.max(0, Math.round(raw)));
}

// ─── মূল পেজ কম্পোনেন্ট (Main Page Component) ─────────────────────────────
export default async function AnalyticsPage() {

  // ১. সব কুয়েরি একসাথে চালানো (Concurrent Queries)
  // Promise.all ব্যবহার করলে সব কুয়েরি একই সময়ে চলে — দ্রুত হয়
  const [
    monthlyRevenueRes,
    topProductsRes,
    topCategoriesRes,
    productScoreRes,
    orderStatusRes,
    customerGrowthRes,
    summaryRes,
  ] = await Promise.all([

    // গত ৬ মাসের মাসিক রেভিনিউ (Monthly Revenue — last 6 months)
    db.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') as month_label,
        DATE_TRUNC('month', order_date) as month_date,
        SUM(total_amount) as revenue,
        COUNT(*) as order_count
      FROM customer_order
      WHERE status NOT IN ('cancelled') 
        AND order_date >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', order_date)
      ORDER BY month_date ASC
    `).catch(() => ({ rows: [] })),

    // সবচেয়ে বেশি বিক্রি হওয়া ৫টি প্রোডাক্ট (Top 5 Products by Sales)
    db.query(`
      SELECT 
        p.product_id,
        p.name,
        p.base_price,
        c.name as category_name,
        SUM(oi.quantity) as total_qty_sold,
        SUM(oi.quantity * oi.unit_price) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM product p
      LEFT JOIN order_item oi ON p.product_id = oi.product_id
      LEFT JOIN customer_order co ON oi.order_id = co.order_id AND co.status != 'cancelled'
      LEFT JOIN category c ON p.category_id = c.category_id
      GROUP BY p.product_id, p.name, p.base_price, c.name
      ORDER BY total_qty_sold DESC NULLS LAST
      LIMIT 5
    `).catch(() => ({ rows: [] })),

    // সবচেয়ে বেশি বিক্রি হওয়া ক্যাটাগরি (Top Categories)
    db.query(`
      SELECT 
        c.name as category_name,
        COUNT(oi.order_item_id) as total_items_sold,
        SUM(oi.quantity) as total_qty,
        SUM(oi.quantity * oi.unit_price) as total_revenue
      FROM category c
      JOIN product p ON p.category_id = c.category_id
      JOIN order_item oi ON oi.product_id = p.product_id
      JOIN customer_order co ON oi.order_id = co.order_id
      WHERE co.status != 'cancelled'
      GROUP BY c.category_id, c.name
      ORDER BY total_qty DESC NULLS LAST
      LIMIT 6
    `).catch(() => ({ rows: [] })),

    // সব প্রোডাক্টের স্কোর হিসাব করার জন্য ডেটা
    db.query(`
      SELECT 
        p.product_id,
        p.name,
        p.base_price,
        c.name as category_name,
        COALESCE(SUM(oi.quantity), 0) as total_qty_sold,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_revenue,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.review_id) as review_count
      FROM product p
      LEFT JOIN category c ON p.category_id = c.category_id
      LEFT JOIN order_item oi ON p.product_id = oi.product_id
      LEFT JOIN customer_order co ON oi.order_id = co.order_id AND co.status != 'cancelled'
      LEFT JOIN review r ON r.product_id = p.product_id
      WHERE p.is_active = true
      GROUP BY p.product_id, p.name, p.base_price, c.name
      ORDER BY total_qty_sold DESC NULLS LAST
    `).catch(() => ({ rows: [] })),

    // অর্ডার স্ট্যাটাস ব্রেকডাউন (Order Status Breakdown)
    db.query(`
      SELECT status, COUNT(*) as count
      FROM customer_order
      GROUP BY status
      ORDER BY count DESC
    `).catch(() => ({ rows: [] })),

    // মাসিক নতুন কাস্টমার রেজিস্ট্রেশন (Monthly New Customers)
    db.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', c.customer_id::text::int::numeric + NOW() - NOW()), 'Mon YYYY') as month_label,
        COUNT(*) as new_customers
      FROM customer c
      GROUP BY DATE_TRUNC('month', NOW())
      LIMIT 6
    `).catch(() => ({ rows: [] })),

    // সামগ্রিক সারাংশ (Overall Summary Stats)
    db.query(`
      SELECT 
        (SELECT COUNT(*) FROM customer_order WHERE status != 'cancelled') as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM customer_order WHERE status IN ('delivered','shipped','processing','confirmed')) as total_revenue,
        (SELECT COUNT(*) FROM customer) as total_customers,
        (SELECT COUNT(*) FROM product WHERE is_active = true) as total_products
    `).catch(() => ({ rows: [{}] })),

  ]);

  // ২. ডেটা প্রস্তুতি (Data Preparation)
  const monthlyRevenue = monthlyRevenueRes.rows;
  const topProducts = topProductsRes.rows;
  const topCategories = topCategoriesRes.rows;
  const orderStatuses = orderStatusRes.rows;
  const summary = summaryRes.rows[0] || {};

  // ৩. PSS স্কোর গণনা ও সাজানো (Calculate PSS and Sort)
  const scoredProducts = productScoreRes.rows.map((p: any) => ({
    ...p,
    pss: calcPSS(p),
    avg_rating: parseFloat(p.avg_rating || 0).toFixed(1),
    total_qty_sold: Number(p.total_qty_sold || 0),
    total_revenue: Number(p.total_revenue || 0),
    review_count: Number(p.review_count || 0),
  })).sort((a: any, b: any) => b.pss - a.pss);

  // ৪. মাসিক রেভিনিউ চার্টের জন্য ম্যাক্সিমাম ভ্যালু বের করা
  const maxRevenue = Math.max(...monthlyRevenue.map((m: any) => Number(m.revenue || 0)), 1);

  // ৫. ক্যাটাগরি চার্টের জন্য ম্যাক্স ভ্যালু
  const maxCategoryQty = Math.max(...topCategories.map((c: any) => Number(c.total_qty || 0)), 1);

  // স্ট্যাটাস কালার ম্যাপিং
  const statusColors: Record<string, string> = {
    delivered: "#4ade80",
    pending: "#eab308",
    confirmed: "#60a5fa",
    processing: "#a78bfa",
    shipped: "#34d399",
    cancelled: "#f87171",
  };

  return (
    <div>
      {/* পেজ হেডার (Page Header) */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 4 }}>
          Analytics & Statistics
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
          Sales performance, product rankings, and business insights
        </p>
      </div>

      {/* সামগ্রিক সারাংশ কার্ড (Summary Cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Revenue", value: `৳${Number(summary.total_revenue || 0).toLocaleString()}`, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, color: "#4ade80", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" },
          { label: "Total Orders", value: Number(summary.total_orders || 0), icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>, color: "#eab308", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)" },
          { label: "Customers", value: Number(summary.total_customers || 0), icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, color: "#c084fc", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)" },
          { label: "Active Products", value: Number(summary.total_products || 0), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>, color: "#60a5fa", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 20, padding: "22px 20px" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 26, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* মাসিক রেভিনিউ চার্ট + অর্ডার স্ট্যাটাস */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>

        {/* মাসিক রেভিনিউ বার চার্ট (Monthly Revenue Bar Chart) */}
        <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 24 }}>
            📈 Monthly Revenue (Last 6 Months)
          </h2>
          {monthlyRevenue.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
              No order data yet. Add some orders to see revenue chart.
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180 }}>
              {monthlyRevenue.map((m: any, i: number) => {
                const h = Math.round((Number(m.revenue) / maxRevenue) * 160) + 20;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                      ৳{Math.round(Number(m.revenue) / 1000)}k
                    </div>
                    <div style={{
                      width: "100%", height: h,
                      background: "linear-gradient(180deg, #eab308, #ca8a04)",
                      borderRadius: "6px 6px 0 0",
                      opacity: 0.85 + (i * 0.025),
                    }} />
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                      {m.month_label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* অর্ডার স্ট্যাটাস ব্রেকডাউন (Order Status Breakdown) */}
        <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 20 }}>
            🗂️ Order Status
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orderStatuses.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No orders yet.</p>
            ) : orderStatuses.map((s: any) => (
              <div key={s.status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: statusColors[s.status] || "#888",
                  }} />
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, textTransform: "capitalize" }}>
                    {s.status}
                  </span>
                </div>
                <span style={{ color: statusColors[s.status] || "#888", fontWeight: 700, fontSize: 14 }}>
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* টপ ক্যাটাগরি + টপ প্রোডাক্ট */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

        {/* টপ ক্যাটাগরি (Top Selling Categories) */}
        <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 20 }}>
            🏆 Top Selling Categories
          </h2>
          {topCategories.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No sales data yet.</p>
          ) : topCategories.map((cat: any, i: number) => {
            const barWidth = Math.round((Number(cat.total_qty) / maxCategoryQty) * 100);
            return (
              <div key={cat.category_name} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500 }}>
                    {["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣"][i]} {cat.category_name}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                    {Number(cat.total_qty)} units
                  </span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 10 }}>
                  <div style={{
                    height: "100%", width: `${barWidth}%`,
                    background: "linear-gradient(90deg, #eab308, #ca8a04)",
                    borderRadius: 10, transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* টপ ৫ প্রোডাক্ট বিক্রি (Top 5 Products by Sales) */}
        <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 20 }}>
            🔥 Best Selling Products
          </h2>
          {topProducts.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No sales yet. Create orders to see data.</p>
          ) : topProducts.map((p: any, i: number) => (
            <div key={p.product_id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: i < topProducts.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontFamily: "Outfit, sans-serif", fontWeight: 800,
                  color: i === 0 ? "#eab308" : "rgba(255,255,255,0.3)", fontSize: 18,
                }}>#{i + 1}</span>
                <div>
                  <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{p.category_name}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 14 }}>
                  {Number(p.total_qty_sold || 0)} sold
                </div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                  ৳{Number(p.total_revenue || 0).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ─── PSS টেবিল: সব প্রোডাক্টের স্কোর ────────────────────────────── */}
      <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Product Strength Score (PSS)
          </h2>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 4 }}>
            PSS = (Sales × 0.4) + (Rating × 20 × 0.25) + (Revenue × 0.0001 × 0.2) + (Reviews × 0.15) — max 100
          </p>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)" }}>
              {["Rank", "Product", "Category", "PSS Score", "Sales Qty", "Revenue", "Avg Rating", "Reviews"].map(h => (
                <th key={h} style={{
                  padding: "12px 16px", textAlign: "left",
                  fontSize: 11, fontWeight: 600,
                  color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scoredProducts.map((p: any, i: number) => {
              // PSS রং নির্ধারণ: স্কোর অনুযায়ী আলাদা রং
              const pssColor = p.pss >= 70 ? "#4ade80" : p.pss >= 40 ? "#eab308" : p.pss >= 10 ? "#60a5fa" : "rgba(255,255,255,0.3)";
              const pssLabel = p.pss >= 70 ? "Excellent" : p.pss >= 40 ? "Good" : p.pss >= 10 ? "Average" : "Low";

              return (
                <tr key={p.product_id} style={{
                  borderBottom: i < scoredProducts.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                }}>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      fontFamily: "Outfit, sans-serif", fontWeight: 800,
                      color: i < 3 ? "#eab308" : "rgba(255,255,255,0.4)", fontSize: 16,
                    }}>#{i + 1}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>
                      ৳{Number(p.base_price || 0).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    {p.category_name || "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {/* PSS স্কোর ভিজ্যুয়াল */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        padding: "4px 10px", borderRadius: 20,
                        background: `${pssColor}18`,
                        border: `1px solid ${pssColor}40`,
                        color: pssColor, fontSize: 13, fontWeight: 700,
                        fontFamily: "Outfit, sans-serif",
                      }}>
                        {p.pss}
                      </div>
                      <span style={{ color: pssColor, fontSize: 11 }}>{pssLabel}</span>
                    </div>
                    {/* PSS প্রগ্রেস বার */}
                    <div style={{ marginTop: 6, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 10, width: 80 }}>
                      <div style={{
                        height: "100%", width: `${p.pss}%`,
                        background: pssColor, borderRadius: 10,
                      }} />
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                    {p.total_qty_sold}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ color: "#eab308", fontWeight: 600, fontSize: 13 }}>
                      ৳{p.total_revenue.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {/* রেটিং স্টার */}
                    <span style={{ color: parseFloat(p.avg_rating) > 0 ? "#eab308" : "rgba(255,255,255,0.2)", fontSize: 13 }}>
                      ★ {parseFloat(p.avg_rating) > 0 ? p.avg_rating : "—"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    {p.review_count}
                  </td>
                </tr>
              );
            })}
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
এই ফাইলটি (`src/app/admin/analytics/page.tsx`) ই-কমার্স সিস্টেমের ব্যবসায়িক বিশ্লেষণ (Business Analytics) ড্যাশবোর্ড। এটি একটি সার্ভার-সাইড রেন্ডারড (SSR) কম্পোনেন্ট যা `force-dynamic` মোডে কাজ করে, অর্থাৎ প্রতিটি রিকোয়েস্টে ডাটাবেস থেকে তাজা ডেটা আনা হয়। এখানে `Promise.all` ব্যবহার করে ৭টি ভিন্ন অ্যানালিটিক্স কুয়েরি সমান্তরালভাবে (Concurrently) চালানো হয়।

২. PSS ফর্মুলা (Product Strength Score):
PSS = (বিক্রির পরিমাণ × ০.৪) + (রেটিং × ২০ × ০.২৫) + (রেভিনিউ × ০.০০০১ × ০.২) + (রিভিউ × ০.১৫)
এই কাস্টম ফর্মুলাটি একটি প্রোডাক্টের বিক্রয় পরিমাণ, গ্রাহক সন্তুষ্টি (রেটিং), আয় এবং গ্রাহক সম্পৃক্ততা (রিভিউ) — এই চারটি মানদণ্ডে প্রোডাক্টের সার্বিক শক্তি পরিমাপ করে। ওজন (Weights) নির্ধারণে বিক্রির পরিমাণকে সর্বোচ্চ গুরুত্ব (৪০%) দেওয়া হয়েছে, কারণ এটি সরাসরি ব্যবসায়িক সাফল্যের সূচক।

৩. চার্ট বাস্তবায়ন (Chart Implementation):
বাহ্যিক কোনো চার্ট লাইব্রেরি (যেমন Chart.js বা Recharts) ব্যবহার না করে সরাসরি HTML `<div>` এবং ইনলাইন CSS দিয়ে বার চার্ট বানানো হয়েছে। উচ্চতা নির্ধারণে ম্যাক্সিমাম ভ্যালু দিয়ে শতকরা হিসাব করা হয়েছে (Normalized Height)।
================================================================================
*/
