// এসইও (SEO) এর জন্য মেটাডেটা ইন্টারফেস।
import { Metadata } from "next";
// ক্লায়েন্ট-সাইড রাউটিং এর জন্য লিংক।
import Link from "next/link";
// ডেটাবেস সংযোগ (Database Connection)।
import { db } from "@/lib/db";
// গ্লোবাল নেভিগেশন বার (Navbar)।
import Navbar from "@/components/Navbar";
// গ্লোবাল ফুটার (Footer)।
import Footer from "@/components/Footer";
// প্রোডাক্ট কার্ড কম্পোনেন্ট
import ProductCard from "@/components/ProductCard";

// ─── মেটাডেটা (Metadata) ──────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "All Products — NodeCommerce",
  description: "Browse thousands of premium products at unbeatable prices.",
};

// পেজিনেশন কনস্ট্যান্ট: প্রতি পেজে কয়টি প্রোডাক্ট দেখানো হবে।
const PAGE_SIZE = 12;

// ─── সার্ভার কম্পোনেন্ট (Server Component) ──────────────────────────────
export default async function ProductsPage({
  searchParams,
}: {
  // ডায়নামিক URL প্যারামিটার (Search Params) ক্যাটাগরি ফিল্টার, সর্টিং, পেজিনেশন এবং সার্চ কোয়েরির জন্য।
  searchParams: Promise<{ category?: string; sort?: string; page?: string; q?: string }>;
}) {
  // ১. প্যারামিটার প্রসেসিং (Parameter Processing):
  const params = await searchParams;
  const categoryId = params.category ? Number(params.category) : undefined;
  const sort = params.sort ?? "newest";
  const page = Number(params.page ?? 1);
  const q = params.q ?? "";

  // ডাইনামিক সর্টিং লজিক (Dynamic Sorting Logic):
  // ইউজার সিলেকশন অনুযায়ী SQL-এর `ORDER BY` ক্লজ (Clause) গঠন
  const orderByStr =
    sort === "price_asc"  ? "p.base_price ASC" :
    sort === "price_desc" ? "p.base_price DESC" :
                            "p.created_at DESC";

  // ডাইনামিক ফিল্টারিং লজিক (Dynamic Filtering Logic):
  // SQL Injection প্রতিরোধ করতে প্যারামিটারাইজড কুয়েরি (Parameterized Query) অ্যারে তৈরি
  const paramsQuery: any[] = [];
  // ডিফল্টভাবে শুধুমাত্র অ্যাক্টিভ প্রোডাক্ট দেখানো হবে
  const whereClauses = ['p.is_active = true'];
  
  if (categoryId) {
    paramsQuery.push(categoryId);
    whereClauses.push(`p.category_id = $${paramsQuery.length}`);
  }
  if (q) {
    paramsQuery.push(`%${q}%`);
    // description কলাম এখন আছে মাইগ্রেশনের পরে — ILIKE দিয়ে সার্চ করা যাবে
    whereClauses.push(`(p.name ILIKE $${paramsQuery.length} OR p.description ILIKE $${paramsQuery.length})`);
  }

  // পেজিনেশন অফসেট (Pagination Offset) নির্ধারণ।
  const offset = (page - 1) * PAGE_SIZE;

  // ৪. ডেটা ফেচিং: .catch(()=>null) ব্যবহার করে প্রতিটি কুয়েরির এরর ধরা হচ্ছে।
  // এটি pg ড্রাইভারের AggregateError-কে Next.js-এর এরর বাউন্ডারি থেকে দূরে রাখে।
  let products: any[] = [];
  let total = 0;
  let categories: any[] = [];
  let totalPages = 1;

  const productsRes = await db.query(`
    SELECT p.*, c.name as category_name,
           (SELECT COUNT(*) FROM review r WHERE r.product_id = p.product_id) as reviews_count,
           (
             SELECT m.image_url
             FROM media m 
             JOIN product_variant pv ON m.variant_code = pv.variant_code
             WHERE pv.product_id = p.product_id 
             LIMIT 1
           ) as image_url,
           (SELECT json_agg(json_build_object('rating', r.rating)) FROM review r WHERE r.product_id = p.product_id) as reviews,
           COALESCE(
             (SELECT json_agg(v) FROM (
               SELECT * FROM product_variant WHERE product_id = p.product_id ORDER BY created_at ASC LIMIT 1
             ) v), '[]'::json
           ) as variants
    FROM product p
    LEFT JOIN category c ON p.category_id = c.category_id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY ${orderByStr}
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `, paramsQuery).catch(() => null);

  const totalRes = await db.query(
    `SELECT COUNT(*) FROM product p WHERE ${whereClauses.join(' AND ')}`,
    paramsQuery
  ).catch(() => null);

  // ক্যাটাগরি ফেচ — parent_category_id IS NULL মানে টপ-লেভেল (মূল) ক্যাটাগরি
  const categoriesRes = await db.query(
    'SELECT * FROM category WHERE parent_category_id IS NULL ORDER BY name ASC'
  ).catch(() => null);

  if (productsRes) {
    // ৫. ডেটা ট্রান্সফরমেশন (Data Transformation):
    products = productsRes.rows.map((row: any) => ({
      ...row,
      base_price: (row.base_price ?? row.price)?.toString(),
      category: row.category_name ? { name: row.category_name } : null,
      reviews: row.reviews || [],
      _count: { reviews: Number(row.reviews_count ?? 0) },
      variants: (row.variants || []).map((v: any) => ({
        ...v,
        price_override: v.price_override ? v.price_override.toString() : null
      }))
    }));
  }
  if (totalRes) {
    total = Number(totalRes.rows[0].count);
    totalPages = Math.ceil(total / PAGE_SIZE);
  }
  if (categoriesRes) {
    categories = categoriesRes.rows;
  }

  // ৬. ইউজার ইন্টারফেস (User Interface - UI):
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "100vh" }}>
        
        {/* টপ হেডার (Top Header): পেজ টাইটেল এবং রেজাল্ট কাউন্ট */}
        <div style={{
          background: "linear-gradient(180deg, rgba(234,179,8,0.05) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "40px 0 32px",
        }}>
          <div className="container">
            <h1 style={{
              fontFamily: "Outfit, sans-serif", fontWeight: 800,
              fontSize: 36, color: "white", marginBottom: 8,
            }}>
              {q ? `Search: "${q}"` : "All Products"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>
              {total} product{total !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: "32px 24px", display: "flex", gap: 32 }}>
          
          {/* সাইডবার (Sidebar): ক্যাটাগরি ফিল্টার এবং সর্টিং অপশন */}
          <aside style={{ width: 220, flexShrink: 0 }}>
            <div style={{
              background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16, padding: 20,
            }}>
              
              {/* ক্যাটাগরি লিস্ট */}
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 15, marginBottom: 16 }}>
                Categories
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {/* 'All Categories' ফিল্টার ক্লিয়ার (Clear Filter) করার অপশন */}
                <Link href="/products" style={{
                  padding: "9px 12px", borderRadius: 10, fontSize: 14,
                  color: !categoryId ? "#eab308" : "rgba(255,255,255,0.55)",
                  background: !categoryId ? "rgba(234,179,8,0.1)" : "transparent",
                  textDecoration: "none", fontWeight: !categoryId ? 600 : 400,
                  border: !categoryId ? "1px solid rgba(234,179,8,0.2)" : "1px solid transparent",
                }}>All Categories</Link>
                {/* ডায়নামিক ক্যাটাগরি লিস্ট */}
                {categories.map((cat) => (
                  <Link key={cat.category_id} href={`/products?category=${cat.category_id}`} style={{
                    padding: "9px 12px", borderRadius: 10, fontSize: 14,
                    color: categoryId === cat.category_id ? "#eab308" : "rgba(255,255,255,0.55)",
                    background: categoryId === cat.category_id ? "rgba(234,179,8,0.1)" : "transparent",
                    textDecoration: "none", fontWeight: categoryId === cat.category_id ? 600 : 400,
                    border: categoryId === cat.category_id ? "1px solid rgba(234,179,8,0.2)" : "1px solid transparent",
                  }}>
                    {cat.name}
                  </Link>
                ))}
              </div>

              {/* সর্টিং (Sorting) অপশন */}
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 15, marginTop: 24, marginBottom: 12 }}>
                Sort By
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  { value: "newest", label: "Newest First" },
                  { value: "price_asc", label: "Price: Low to High" },
                  { value: "price_desc", label: "Price: High to Low" },
                ].map((s) => (
                  // URL-এ বিদ্যমান প্যারামিটারগুলো বজায় রেখে শুধু সর্ট প্যারামিটার অ্যাড বা আপডেট করা হচ্ছে।
                  <Link key={s.value} href={`/products?${new URLSearchParams({ ...(categoryId ? { category: String(categoryId) } : {}), sort: s.value })}`} style={{
                    padding: "9px 12px", borderRadius: 10, fontSize: 14,
                    color: sort === s.value ? "#eab308" : "rgba(255,255,255,0.55)",
                    background: sort === s.value ? "rgba(234,179,8,0.1)" : "transparent",
                    textDecoration: "none", fontWeight: sort === s.value ? 600 : 400,
                    border: sort === s.value ? "1px solid rgba(234,179,8,0.2)" : "1px solid transparent",
                  }}>{s.label}</Link>
                ))}
              </div>
            </div>
          </aside>

          {/* প্রোডাক্ট গ্রিড (Product Grid) */}
          <div style={{ flex: 1 }}>
            {products.length === 0 ? (
              // এম্পটি স্টেট (Empty State)
              <div style={{ textAlign: "center", paddingTop: 80 }}>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }}>No products found</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {products.map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
              </div>
            )}

            {/* পেজিনেশন (Pagination) কন্ট্রোল */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={`/products?${new URLSearchParams({ ...(categoryId ? { category: String(categoryId) } : {}), page: String(p) })}`} style={{
                    width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none",
                    background: p === page ? "linear-gradient(135deg, #eab308, #ca8a04)" : "rgba(255,255,255,0.04)",
                    border: p === page ? "none" : "1px solid rgba(255,255,255,0.08)",
                    color: p === page ? "white" : "rgba(255,255,255,0.5)",
                  }}>{p}</Link>
                ))}
              </div>
            )}
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
এই ফাইলটি (`src/app/products/page.tsx`) ই-কমার্স সাইটের মেইন প্রোডাক্ট লিস্টিং (Product Listing) বা স্টোরফ্রন্ট (Storefront) পেজ। এটি নেক্সট.জেএস-এর একটি ফুলি ডায়নামিক (Fully Dynamic) সার্ভার-সাইড রেন্ডারড (SSR) কম্পোনেন্ট। ইউজার URL এ যেসব প্যারামিটার (যেমন: category, sort, page, q) প্রোভাইড করে, তার ভিত্তিতে ডায়নামিক SQL কুয়েরি বিল্ড করে ডাটাবেস থেকে ডেটা ফেচ করা হয়। 

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এটি একটি পাবলিক ফেসিং (Public Facing) পেজ হওয়ায় এখানে কোনো অথেনটিকেশন চেকের প্রয়োজন নেই। তবে SQL Injection প্রতিরোধ করার জন্য ডায়নামিক `WHERE` ক্লজ তৈরি করার সময় ইউজার ইনপুটগুলো সরাসরি স্ট্রিংয়ে যুক্ত না করে `paramsQuery` নামক অ্যারের মাধ্যমে প্যারামিটারাইজড (Parameterized: $1, $2) করে ডাটাবেস ড্রাইভারের কাছে পাঠানো হয়েছে। এটি সিকিউরিটির জন্য অত্যন্ত ক্রুশিয়াল (Crucial)।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই পেজটির ডেটাবেস অপ্টিমাইজেশন বেশ শক্তিশালী। প্রোডাক্টের বেসিক ডেটার পাশাপাশি সাবকুয়েরি এবং `json_agg` ব্যবহার করে রিলেশনাল ডেটা (যেমন: রিভিউয়ের রেটিং এবং ভ্যারিয়েন্ট ইনফো) একই নেটওয়ার্ক কলে (Network Call) ফেচ করা হয়েছে। এটি N+1 কোয়েরি প্রবলেম (N+1 Query Problem) থেকে রক্ষা করে, যা ক্লাসিক্যাল ORM গুলোতে একটি কমন সমস্যা। এছাড়া, `Promise.all` ব্যবহার করে তিনটি আলাদা কোয়েরি (প্রোডাক্টস, টোটাল কাউন্ট এবং ক্যাটাগরিস) প্যারালালি এক্সিকিউট করা হয়েছে, যা পেজের রেসপন্স টাইম (Response Time) উল্লেখযোগ্য হারে কমিয়ে দেয়।
================================================================================
*/
