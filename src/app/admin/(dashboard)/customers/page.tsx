// এসইও (SEO) এর জন্য মেটাডেটা ইন্টারফেস।
import { Metadata } from "next";
// ডেটাবেস ইনস্ট্যান্স, কাস্টমার লিস্ট এবং রিলেশনাল ডেটা ফেচ করার জন্য।
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
// পেজিনেশন (Pagination) লিংকের জন্য।
import Link from "next/link";

// ─── মেটাডেটা (Metadata) ──────────────────────────────────────────────────────────
export const metadata: Metadata = { title: "Customers — Admin" };

// ─── সার্ভার কম্পোনেন্ট (Server Component) ──────────────────────────────
export default async function AdminCustomersPage({
  // প্রমাণীকরণ যাচাই (Authentication Validation on every page):
  // অননুমোদিত ব্যবহারকারী এক্সেস করলে /admin/login-এ রিডাইরেক্ট হবে।
  await requireAdmin();

  searchParams,
}: {
  // ডায়নামিক URL প্যারামিটার (Search Params), মূলত পেজিনেশনের জন্য ব্যবহৃত হয়।
  searchParams: Promise<{ page?: string }>;
}) {
  // ১. প্যারামিটার এক্সট্র্যাকশন (Parameter Extraction):
  const params = await searchParams;
  // পেজ নম্বর (ডিফল্ট: ১) এবং প্রতি পেজে কয়টি রেকর্ড দেখানো হবে তা নির্ধারণ।
  const page = Number(params.page ?? 1);
  const PAGE_SIZE = 20;

  // ২. পেজিনেশন অফসেট গণনা (Offset Calculation):
  const offset = (page - 1) * PAGE_SIZE;
  
  // ৩. ডেটা ফেচিং (Data Fetching / Scatter-Gather Pattern):
  // কাস্টমার ডেটা এবং টোটাল কাউন্ট (Total Count) সমান্তরালে (Parallel) ফেচ করা হচ্ছে।
  const [customersRes, countRes] = await Promise.all([
    db.query(`
      SELECT c.*,
             -- সাবকুয়েরি (Subquery): কাস্টমারের মোট অর্ডার সংখ্যা গণনা
             (SELECT COUNT(*) FROM customer_order o WHERE o.customer_id = c.customer_id) as orders_count,
             -- সাবকুয়েরি (Subquery): কাস্টমারের মোট রিভিউ সংখ্যা গণনা
             (SELECT COUNT(*) FROM review r WHERE r.customer_id = c.customer_id) as reviews_count,
             -- JSON অ্যাগ্রিগেশন (JSON Aggregation): কাস্টমারের সমস্ত অর্ডারের অ্যামাউন্ট এবং স্ট্যাটাস JSON অ্যারে হিসেবে ফেচ করা
             COALESCE(
               (SELECT json_agg(json_build_object('total_amount', o.total_amount, 'status', o.status)) 
                FROM customer_order o WHERE o.customer_id = c.customer_id),
               '[]'::json
             ) as orders
      FROM customer c
      ORDER BY c.created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `),
    // টোটাল কাস্টমার কাউন্ট, যা পেজিনেশন রেন্ডার করতে প্রয়োজন।
    db.query('SELECT COUNT(*) FROM customer')
  ]);

  // ৪. ডেটা সিরিয়ালাইজেশন ও ট্রান্সফরমেশন (Data Serialization & Transformation):
  const customers = customersRes.rows.map(c => ({
    ...c,
    // COUNT() কোয়েরি থেকে আসা BigInt/String ডেটাকে Number-এ রূপান্তর।
    _count: { orders: Number(c.orders_count), reviews: Number(c.reviews_count) },
    orders: c.orders
  }));
  const total = Number(countRes.rows[0].count);

  // ৫. মোট পৃষ্ঠা গণনা (Total Pages Calculation):
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ৬. ইউজার ইন্টারফেস (User Interface - UI):
  return (
    <div>
      {/* হেডার (Header) */}
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 28 }}>
        Customers ({total})
      </h1>

      {/* কাস্টমার টেবিল (Customer Table) */}
      <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {/* টেবিল হেডার (Table Header) */}
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
              {["Customer", "Contact", "Joined", "Orders", "Total Spent", "Reviews", "Status"].map(h => (
                <th key={h} style={{ padding: "13px 18px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          {/* টেবিল বডি (Table Body) */}
          <tbody>
            {customers.map((c: any, i: number) => {
              // কাস্টমারের মোট ব্যয়ের পরিমাণ (Total Spent) হিসাব করা।
              // ক্যানসেল বা পেন্ডিং অর্ডার বাদে বাকি অর্ডারগুলোর (যেমন: delivered, processed) অ্যামাউন্ট যোগ করা হচ্ছে।
              const totalSpent = c.orders
                .filter((o: any) => !["cancelled", "pending"].includes(o.status))
                .reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);

              return (
                <tr key={c.customer_id} style={{ borderBottom: i < customers.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  {/* কাস্টমারের নাম ও আইডি */}
                  <td style={{ padding: "13px 18px" }}>
                    <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "monospace", marginTop: 2 }}>ID: {c.customer_id}</div>
                  </td>
                  {/* যোগাযোগের তথ্য (ইমেইল ও ফোন) */}
                  <td style={{ padding: "13px 18px" }}>
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{c.email}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{c.phone || "—"}</div>
                  </td>
                  {/* রেজিস্ট্রেশনের তারিখ (Joined Date) */}
                  <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  {/* অর্ডারের সংখ্যা */}
                  <td style={{ padding: "13px 18px", color: "white", fontWeight: 600 }}>{c._count.orders}</td>
                  {/* মোট ব্যয় (Total Spent) */}
                  <td style={{ padding: "13px 18px" }}>
                    <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>৳{totalSpent.toLocaleString()}</span>
                  </td>
                  {/* রিভিউ সংখ্যা */}
                  <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{c._count.reviews}</td>
                  {/* অ্যাকাউন্ট স্ট্যাটাস */}
                  <td style={{ padding: "13px 18px" }}>
                    <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 8, background: c.is_active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: c.is_active ? "#4ade80" : "#f87171" }}>
                      {c.is_active ? "Active" : "Banned"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* পেজিনেশন (Pagination) */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 20, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link key={p} href={`/admin/customers?page=${p}`} style={{
                width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none",
                background: p === page ? "linear-gradient(135deg, #eab308, #ca8a04)" : "rgba(255,255,255,0.04)",
                color: p === page ? "white" : "rgba(255,255,255,0.5)",
              }}>{p}</Link>
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
এই ফাইলটি (`src/app/admin/customers/page.tsx`) অ্যাডমিন ড্যাশবোর্ডের কাস্টমার ম্যানেজমেন্ট সেকশন রেন্ডার করে। এটি একটি পিওর সার্ভার-সাইড রেন্ডারড (SSR) পেজ, যা পেজিনেশন (Pagination) সাপোর্ট করে। এখানে কাস্টমারদের বেসিক ইনফরমেশন এবং তাদের শপিং হ্যাবিট (Shopping Habit / Total Spent) দেখানো হয়। 

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
অ্যাডমিন লেআউটের আন্ডারে থাকায় এটি সম্পূর্ণ সুরক্ষিত। LIMIT এবং OFFSET এর ভ্যালু সরাসরি SQL এ বসানো হলেও, ভ্যালুগুলো গাণিতিক অপারেশনের মাধ্যমে (`Number` টাইপ কাস্টিং করে) তৈরি হওয়ায় এসকিউএল ইনজেকশনের (SQL Injection) ঝুঁকি নেই।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই পেজটির ডেটা ফেচিং মেকানিজম অত্যন্ত অপ্টিমাইজড। N+1 কোয়েরি সমস্যা (N+1 Query Problem) এড়ানোর জন্য ডেটাবেস লেভেলেই `json_agg` ফাংশন ব্যবহার করে কাস্টমারের সমস্ত অর্ডারের স্ট্যাটাস এবং অ্যামাউন্ট একটি JSON অ্যারে হিসেবে ফেচ করা হয়েছে। এরপর অ্যাপ্লিকেশন লেয়ারে (Memory-তে) `Array.prototype.reduce` ব্যবহার করে "টোটাল স্পেন্ট (Total Spent)" कैलकुलेट (Calculate) করা হয়েছে। এর ফলে ডেটাবেসের উপর কমপ্লেক্স ম্যাথামেটিকাল কোয়েরির চাপ কমে এবং পারফরম্যান্স বুস্ট হয়। 
================================================================================
*/
