import { Metadata } from "next";
import { requireCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import AddMoneyClient from "./AddMoneyClient";

export const metadata: Metadata = { title: "My Wallet — NodeCommerce" };

export default async function WalletPage() {
  const session = await requireCustomer();

  const [walletRes, refundsRes] = await Promise.all([
    db.query('SELECT * FROM wallet WHERE customer_id = $1', [session.id]),
    db.query(`
      SELECT r.*, rq.order_id
      FROM refund r
      JOIN return_request rq ON r.return_id = rq.return_id
      JOIN customer_order o ON rq.order_id = o.order_id
      WHERE r.status = 'processed' AND o.customer_id = $1
      ORDER BY r.processed_at DESC LIMIT 10
    `, [session.id])
  ]);

  const wallet = walletRes.rows[0] || null;
  const refunds = refundsRes.rows.map(row => ({
    ...row,
    return_request: { order: { order_id: row.order_id } }
  }));

  const balance = Number(wallet?.balance ?? 0);

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 28 }}>My Wallet</h1>

      {/* Balance Card */}
      <div style={{
        background: "linear-gradient(135deg, rgba(234,179,8,0.15), rgba(168,85,247,0.1))",
        border: "1px solid rgba(234,179,8,0.2)", borderRadius: 24, padding: "40px 32px",
        marginBottom: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(234,179,8,0.05)" }} />
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Available Balance</div>
        <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900, fontSize: 52, color: "white" }}>
          ৳{balance.toLocaleString()}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
          Use at checkout for instant discount
        </div>
        <AddMoneyClient />
      </div>

      {/* Transaction History */}
      <div style={{ background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
        <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 20 }}>
          Refund History
        </h2>
        {refunds.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
            No refunds yet
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {refunds.map((r) => (
              <div key={r.refund_id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: "white", fontSize: 14 }}>
                    Refund — Order #{r.return_request.order.order_id}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>
                    {r.processed_at ? new Date(r.processed_at).toLocaleDateString() : "Processing"}
                  </div>
                </div>
                <span style={{ color: "#4ade80", fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16 }}>
                  +৳{Number(r.amount).toLocaleString()}
                </span>
              </div>
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
