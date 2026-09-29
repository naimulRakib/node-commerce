// এসইও (SEO) এর জন্য নেক্সট.জেএস এর বিল্ট-ইন মেটাডেটা ইন্টারফেস।
import { Metadata } from "next";
// ক্লায়েন্ট-সাইড রাউটিং এর জন্য লিংক কম্পোনেন্ট।
import Link from "next/link";
// ডাটাবেস ইন্সট্যান্স (Database Instance), যা র (Raw) SQL চালানোর জন্য ব্যবহৃত হয়।
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// ─── মেটাডেটা (Metadata) ──────────────────────────────────────────────────────────
export const metadata: Metadata = { title: "Products — Admin" };

// ─── সার্ভার কম্পোনেন্ট (Server Component) ──────────────────────────────
export default async function AdminProductsPage() {
  // প্রমাণীকরণ যাচাই (Authentication Validation on every page):
  // অননুমোদিত ব্যবহারকারী এক্সেস করলে /admin/login-এ রিডাইরেক্ট হবে।
  await requireAdmin();

  // ১. কমপ্লেক্স ডাটাবেস কুয়েরি (Complex Database Query):
  // এটি একটি অত্যন্ত অপ্টিমাইজড কুয়েরি যা N+1 প্রবলেম (N+1 Query Problem) সমাধান করে।
  // প্রোডাক্টের বেস ডেটার পাশাপাশি, সাবকুয়েরি (Subquery) দিয়ে রিভিউ கவுন্ট (Reviews Count) 
  // এবং 'json_agg' ও 'json_build_object' ব্যবহার করে ভ্যারিয়েন্টের স্টক পরিমাণ একটি JSON অ্যারে (JSON Array) হিসেবে ফেচ করা হচ্ছে।
  const productsRes = await db.query(`
    SELECT p.*, c.name as category_name,
           (SELECT COUNT(*) FROM review r WHERE r.product_id = p.product_id) as reviews_count,
           COALESCE((SELECT json_agg(json_build_object('quantity', v.quantity)) FROM product_variant v WHERE v.product_id = p.product_id), '[]'::json) as variants
    FROM product p
    LEFT JOIN category c ON p.category_id = c.category_id
    ORDER BY p.created_at DESC
  `);
  
  // ২. ডেটা ম্যাপিং (Data Mapping):
  // ফ্রন্টএন্ডে সহজে রেন্ডার করার জন্য র (Raw) SQL রেজাল্টকে সুন্দর ও পরিচ্ছন্ন অবজেক্টে (Object) ম্যাপ করা হচ্ছে।
  const products = productsRes.rows.map(row => ({
    ...row,
    category: row.category_name ? { name: row.category_name } : null,
    _count: { reviews: Number(row.reviews_count) }, // এগ্রিগেশন রেজাল্ট স্ট্রিং হওয়ায় নাম্বারে কাস্ট করা হচ্ছে।
    variants: row.variants
  }));

  // ৩. ইউজার ইন্টারফেস (User Interface - UI):
  return (
    <div>
      {/* হেডার সেকশন (Header Section) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white" }}>
          Products ({products.length})
        </h1>
        {/* নতুন প্রোডাক্ট যুক্ত করার বাটন (Add Product Button) */}
        <Link href="/admin/products/new" style={{
          padding: "11px 22px", background: "linear-gradient(135deg, #eab308, #ca8a04)",
          borderRadius: 12, color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none",
        }}>+ Add Product</Link>
      </div>

      {/* প্রোডাক্ট টেবিল (Products Table) */}
      <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
              {["Product", "Code", "Category", "Base Price", "Stock", "Reviews", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "13px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product, i) => {
              // ৪. ডাইনামিক ক্যালকুলেশন (Dynamic Calculation):
              // 'json_agg' থেকে প্রাপ্ত ভ্যারিয়েন্ট অ্যারে ব্যবহার করে সর্বমোট স্টক (Total Stock) হিসাব করা হচ্ছে।
              const totalStock = product.variants.reduce((s: number, v: any) => s + v.quantity, 0);
              
              // কন্ডিশনাল ফ্লাগস (Conditional Flags) - স্টকের অবস্থার ওপর ভিত্তি করে।
              const isLow = totalStock <= 10 && totalStock > 0;
              const isOut = totalStock === 0;

              return (
                <tr key={product.product_id} style={{ borderBottom: i < products.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <td style={{ padding: "13px 18px" }}>
                    <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>{product.name}</div>
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{product.product_code}</span>
                  </td>
                  <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.55)", fontSize: 13 }}>{product.category?.name ?? "—"}</td>
                  <td style={{ padding: "13px 18px" }}>
                    <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>৳{Number(product.base_price).toLocaleString()}</span>
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    {/* কন্ডিশনাল স্টাইলিং (Conditional Styling): স্টক অবস্থার ওপর ভিত্তি করে কালার কোডিং। */}
                    <span style={{
                      fontSize: 13, fontWeight: 600, padding: "3px 10px", borderRadius: 8,
                      background: isOut ? "rgba(239,68,68,0.1)" : isLow ? "rgba(234,179,8,0.1)" : "rgba(34,197,94,0.1)",
                      color: isOut ? "#f87171" : isLow ? "#eab308" : "#4ade80",
                    }}>{totalStock} units</span>
                  </td>
                  <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>{product._count.reviews}</td>
                  <td style={{ padding: "13px 18px" }}>
                    {/* অ্যাক্টিভ স্ট্যাটাস ব্যাজ */}
                    <span style={{
                      fontSize: 12, padding: "3px 10px", borderRadius: 8,
                      background: product.is_active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: product.is_active ? "#4ade80" : "#f87171",
                    }}>{product.is_active ? "Active" : "Inactive"}</span>
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <Link href={`/admin/products/${product.product_id}/edit`} style={{ fontSize: 13, color: "#eab308", textDecoration: "none", padding: "5px 12px", borderRadius: 8, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                      Edit
                    </Link>
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
এই ফাইলটি (`src/app/admin/products/page.tsx`) অ্যাডমিন প্যানেলে ইনভেন্টরি বা প্রোডাক্ট লিস্ট (Product List) দেখানোর কাজ করে। এটি একটি সার্ভার-সাইড রেন্ডারড (SSR) কম্পোনেন্ট। এর সবচেয়ে আকর্ষণীয় দিকটি হলো এর ডাটাবেস কুয়েরি অপ্টিমাইজেশন (Database Query Optimization)। সাধারণত প্রোডাক্টের লিস্ট দেখানোর সময় প্রতিটি প্রোডাক্টের রিভিউ সংখ্যা এবং ভ্যারিয়েন্ট স্টক জানতে একাধিক কুয়েরি (N+1 Query) ফায়ার করতে হয়, যা পারফরম্যান্সের জন্য ক্ষতিকর। এখানে PostgreSQL এর পাওয়ারফুল ডেটা টাইপ এবং ফাংশন (`json_agg`, `json_build_object`) ব্যবহার করে ডেটাবেস লেভেলেই (Database-level Aggregation) রিলেশনাল ডেটাকে JSON এ রূপান্তর করা হয়েছে, যার ফলে একটিমাত্র কুয়েরিতে সম্পূর্ণ গ্রাফ (Graph) উঠে আসে। 

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
অ্যাডমিন রাউট হওয়ায় এটি `AdminLayout` দ্বারা গ্লোবালি সুরক্ষিত (Globally Protected)। এখানে কোনো ইউজার ইনপুট নেই, তাই কুয়েরিতে প্যারামিটারাইজেশনের (Parameterized Statement) প্রয়োজন পড়েনি, এবং এসকিউএল ইনজেকশনের (SQL Injection) কোনো ঝুঁকিও নেই। 

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এখানে সার্ভার মেমরি এবং প্রসেসর ইউটিলাইজেশন (Processor Utilization) অত্যন্ত চমৎকার। ডেটাবেস থেকে প্রাপ্ত JSON অ্যারে (`variants`) সরাসরি জাভাস্ক্রিপ্টের `reduce` ফাংশন দিয়ে প্রসেস করে টোটাল স্টক ক্যালকুলেট করা হয়েছে। এই ক্যালকুলেশনের ওপর ভিত্তি করে UI তে ডায়নামিক কালার-কোডেড (Color-coded) ব্যাজ রেন্ডার করা হয়, যা অ্যাডমিনকে খুব দ্রুত আউট-অফ-স্টক (Out-of-stock) বা লো-স্টক (Low-stock) আইটেমগুলো সনাক্ত করতে সাহায্য করে। ডেটা ফ্লো সম্পূর্ণ একমুখী: ডেটাবেস -> সার্ভার কম্পোনেন্ট -> ক্লায়েন্ট ব্রাউজার (HTML)।
================================================================================
*/
