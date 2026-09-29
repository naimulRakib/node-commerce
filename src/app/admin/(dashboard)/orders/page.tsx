// এসইও (SEO) অপ্টিমাইজেশনের জন্য মেটাডেটা টাইপ।
import { Metadata } from "next";
// ক্লায়েন্ট-সাইড রাউটিং এর জন্য লিংক কম্পোনেন্ট।
import Link from "next/link";
// ডাটাবেসের সাথে ইন্টারঅ্যাক্ট করার জন্য।
import { db } from "@/lib/db";
// স্ট্যাটাস অনুযায়ী ডায়নামিক ব্যাজ রেন্ডার করার জন্য।
import OrderStatusBadge from "@/components/OrderStatusBadge";

// ─── মেটাডেটা (Metadata) ──────────────────────────────────────────────────────────
export const metadata: Metadata = { title: "Orders — Admin" };

// ─── সার্ভার কম্পোনেন্ট (Server Component) ──────────────────────────────
// এই কম্পোনেন্টটি ইউআরএল এর কোয়েরি প্যারামিটারগুলো (URL Query Parameters - 'status' এবং 'page') 
// সরাসরি প্রপস (Props) হিসেবে গ্রহণ করে (Server-side Search/Pagination)।
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  // ১. প্যারামিটার রেজোলিউশন (Parameter Resolution)
  const params = await searchParams;
  const status = params.status ?? "";
  const page = Number(params.page ?? 1);
  const PAGE_SIZE = 15; // প্রতি পেজে কতগুলো আইটেম থাকবে (Pagination Constant)

  // ২. অফসেট ক্যালকুলেশন (Offset Calculation): 
  // SQL এর OFFSET ক্লজের জন্য গাণিতিক হিসাব।
  const offset = (page - 1) * PAGE_SIZE;
  
  // ৩. ডায়নামিক কুয়েরি বিল্ডিং (Dynamic Query Building):
  let whereSql = '';
  const queryParams: any[] = [];
  // যদি ইউআরএল এ 'status' প্যারামিটার থাকে, তবে SQL কুয়েরিতে 'WHERE' ক্লজ যুক্ত করা হয়।
  if (status) {
    whereSql = 'WHERE o.status = $1';
    queryParams.push(status);
  }

  // ৪. কনকারেন্ট ডেটা ফেচিং (Concurrent Data Fetching): 
  // ডেটা (Orders) এবং সর্বমোট সংখ্যা (Count) একই সাথে আনা হচ্ছে 'Promise.all' এর মাধ্যমে।
  const [ordersRes, countRes] = await Promise.all([
    db.query(`
      SELECT o.*, 
             c.name as customer_name, c.email as customer_email,
             co.name as courier_name,
             (SELECT COUNT(*) FROM order_item i WHERE i.order_id = o.order_id) as items_count
      FROM customer_order o
      JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN courier co ON o.courier_id = co.courier_id
      ${whereSql}
      ORDER BY o.order_date DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `, queryParams),
    // সর্বমোট অর্ডারের সংখ্যা (যাতে পেজিনেশনের পেজগুলো ঠিকমতো জেনারেট করা যায়)
    db.query(`SELECT COUNT(*) FROM customer_order o ${whereSql}`, queryParams)
  ]);

  // ৫. ডেটা ট্রান্সফরমেশন (Data Transformation): 
  // র (Raw) SQL ডেটাকে ফ্রন্টএন্ডের উপযুক্ত JSON অবজেক্টে রূপান্তর করা হচ্ছে।
  const orders = ordersRes.rows.map(row => ({
    ...row,
    customer: { name: row.customer_name, email: row.customer_email },
    courier: row.courier_name ? { name: row.courier_name } : null,
    items: new Array(Number(row.items_count)) // Mock array just so .length works (শুধুমাত্র কাউন্ট দেখানোর জন্য)
  }));
  const total = Number(countRes.rows[0].count);

  // ৬. পেজিনেশন লজিক (Pagination Logic): মোট কতগুলো পেজ হবে তা নির্ধারণ।
  const totalPages = Math.ceil(total / PAGE_SIZE);
  // ফিল্টারিং এর জন্য সম্ভাব্য স্ট্যাটাসগুলোর একটি তালিকা।
  const statusFilters = ["", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

  // ৭. ইউজার ইন্টারফেস (User Interface - UI):
  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 24 }}>
        Orders Management
      </h1>

      {/* স্ট্যাটাস ফিল্টারস (Status Filters) */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {statusFilters.map((s) => (
          <Link key={s} href={`/admin/orders${s ? "?status=" + s : ""}`} style={{
            padding: "8px 16px", borderRadius: 50, fontSize: 13, textDecoration: "none",
            // বর্তমানে যে স্ট্যাটাসটি সিলেক্ট করা আছে, সেটির ডিজাইন আলাদা করার জন্য কন্ডিশনাল স্টাইলিং (Conditional Styling)।
            background: status === s ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)",
            border: status === s ? "1px solid rgba(234,179,8,0.4)" : "1px solid rgba(255,255,255,0.07)",
            color: status === s ? "#eab308" : "rgba(255,255,255,0.5)",
            fontWeight: status === s ? 600 : 400,
            textTransform: "capitalize",
          }}>{s || "All"}</Link>
        ))}
      </div>

      {/* অর্ডারস টেবিল (Orders Table) */}
      <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
              {["Order ID", "Customer", "Items", "Courier", "Total", "Date", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "13px 18px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any, i: number) => (
              <tr key={order.order_id} style={{ borderBottom: i < orders.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                <td style={{ padding: "13px 18px" }}><span style={{ fontFamily: "monospace", color: "#eab308", fontWeight: 700 }}>#{order.order_id}</span></td>
                <td style={{ padding: "13px 18px" }}>
                  <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>{order.customer.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{order.customer.email}</div>
                </td>
                <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{order.items.length}</td>
                <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.55)", fontSize: 13 }}>{order.courier?.name ?? "—"}</td>
                <td style={{ padding: "13px 18px" }}><span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>৳{Number(order.total_amount).toLocaleString()}</span></td>
                <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                  {new Date(order.order_date).toLocaleDateString("en-GB")}
                </td>
                <td style={{ padding: "13px 18px" }}><OrderStatusBadge status={order.status} /></td>
                <td style={{ padding: "13px 18px" }}>
                  <Link href={`/admin/orders/${order.order_id}`} style={{ fontSize: 13, color: "#eab308", textDecoration: "none", padding: "5px 12px", borderRadius: 8, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* পেজিনেশন কন্ট্রোলস (Pagination Controls) */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 20, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            {/* ডায়নামিকভাবে পেজ নাম্বার জেনারেট করা হচ্ছে */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link key={p} href={`/admin/orders?${new URLSearchParams({ ...(status ? { status } : {}), page: String(p) })}`} style={{
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
এই ফাইলটি (`src/app/admin/orders/page.tsx`) সার্ভার-সাইড রেন্ডারড (SSR) একটি তালিকা বা লিস্ট ভিউ (List View)। এখানে সার্ভার-সাইড ফিল্টারিং (Server-side Filtering) এবং পেজিনেশন (Pagination) অত্যন্ত নিখুঁতভাবে বাস্তবায়িত হয়েছে। ক্লায়েন্ট-সাইডে স্টেট (State - যেমন `useState`) ম্যানেজ না করে ইউআরএল কোয়েরি প্যারামিটার (`?status=...&page=...`) ব্যবহার করে ফিল্টারিং করা হয়েছে। এটি নেক্সট.জেএস (Next.js) এর একটি বেস্ট প্র্যাকটিস, কারণ এর ফলে ফিল্টার করা ফলাফল বুকমার্ক (Bookmark) করা যায় এবং লিংক শেয়ার করা যায়। তাছাড়া, ব্রাউজারের ব্যাক বাটন (Back Button) যথাযথভাবে কাজ করে। 

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
যদিও এই ফাইলে সরাসরি `requireAdmin()` নেই, এটি লেআউট দ্বারা সুরক্ষিত। ডেটাবেস কুয়েরিতে ইনপুট কনক্যাটিনেশনের (String Concatenation) পরিবর্তে প্যারামিটারাইজড ভ্যালু (`$1`) ব্যবহার করা হয়েছে। এটি অত্যন্ত গুরুত্বপূর্ণ, কারণ ইউআরএল থেকে আসা প্যারামিটার (`params.status`) সরাসরি কুয়েরিতে বসালে এসকিউএল ইনজেকশন (SQL Injection) হওয়ার সম্ভাবনা থাকত। 

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই পেজটিতে `LIMIT` এবং `OFFSET` ব্যবহার করে ডেটাবেস-লেভেল পেজিনেশন (Database-level Pagination) করা হয়েছে। অর্থাৎ, ডাটাবেস থেকে শুধু বর্তমান পেজের (যেমন: ১৫টি) ডেটাই সার্ভারের মেমরিতে আসে, সম্পূর্ণ ডাটাবেস আসে না। এটি মেমরি ফুটপ্রিন্ট (Memory Footprint) ছোট রাখে এবং লাখ লাখ অর্ডার থাকলেও পেজটি মিলি-সেকেন্ডের মধ্যে লোড হতে সক্ষম। ডেটা ফ্লো সম্পূর্ণ টপ-ডাউন (Top-down) এবং সার্ভার থেকে রেন্ডার হওয়া HTML সরাসরি ক্লায়েন্ট ব্রাউজারে প্রদর্শিত হয়।
================================================================================
*/
