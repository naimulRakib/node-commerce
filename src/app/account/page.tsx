import { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import OrderStatusBadge from "@/components/OrderStatusBadge";

export const metadata: Metadata = { title: "My Account — NodeCommerce" };

export default async function AccountPage() {
  const session = await requireCustomer();

  const [ordersRes, walletRes, wishlistRes, notificationsRes] = await Promise.all([
    db.query(`
      SELECT o.*, 
             (SELECT COUNT(*) FROM order_item i WHERE i.order_id = o.order_id) as items_count
      FROM customer_order o 
      WHERE o.customer_id = $1 
      ORDER BY o.order_date DESC LIMIT 5
    `, [session.id]),
    db.query('SELECT balance FROM wallet WHERE customer_id = $1', [session.id]),
    db.query(`
      SELECT COUNT(*) FROM wishlist_item i
      JOIN wishlist w ON i.wishlist_id = w.wishlist_id
      WHERE w.customer_id = $1
    `, [session.id]),
    db.query('SELECT COUNT(*) FROM notification WHERE customer_id = $1 AND is_read = false', [session.id])
  ]);

  const orders = ordersRes.rows.map(row => ({ ...row, items: new Array(Number(row.items_count)) }));
  const wallet = walletRes.rows[0] || null;
  const wishlistCount = Number(wishlistRes.rows[0].count);
  const notificationsCount = Number(notificationsRes.rows[0].count);

  const stats = [
    { label: "Total Orders", value: orders.length + (orders.length === 5 ? "+" : ""), icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> },
    { label: "Wallet Balance", value: `৳${Number(wallet?.balance ?? 0).toLocaleString()}`, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { label: "Wishlist Items", value: wishlistCount, icon: "❤️" },
    { label: "Notifications", value: notificationsCount, icon: "🔔" },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 8 }}>
        Welcome back, {session.name.split(" ")[0]}! 👋
      </h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, marginBottom: 32 }}>
        Here&apos;s what&apos;s happening with your account.
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{
            background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 20,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 24, color: "white" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{
        background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20, padding: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18 }}>
            Recent Orders
          </h2>
          <Link href="/account/orders" style={{ color: "#eab308", fontSize: 13, textDecoration: "none" }}>
            View All →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 15 }}>No orders yet</p>
            <Link href="/products" style={{ color: "#eab308", fontSize: 14, textDecoration: "none", marginTop: 8, display: "block" }}>
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orders.map((order) => (
              <Link key={order.order_id} href={`/account/orders/${order.order_id}`} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                textDecoration: "none", transition: "all 0.2s ease",
              }}>
                <div>
                  <span style={{ fontFamily: "monospace", color: "#eab308", fontWeight: 700 }}>#{order.order_id}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginLeft: 12 }}>
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
                    ৳{Number(order.total_amount).toLocaleString()}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
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
