import { Metadata } from "next";
import Image from "next/image";
// ক্লায়েন্ট-সাইড রাউটিং এর জন্য নেক্সট.জেএস এর 'Link' কম্পোনেন্ট।
import Link from "next/link";
// সরাসরি SQL কুয়েরি চালানোর জন্য ডাটাবেস পুল (Database pool)।
import { db } from "@/lib/db";
// সেশন (Session) চেক করার জন্য।
import { getSession } from "@/lib/auth";
// গ্লোবাল নেভিগেশন বার (Navbar)।
import Navbar from "@/components/Navbar";
// গ্লোবাল ফুটার (Footer)।
import Footer from "@/components/Footer";
// প্রোডাক্ট প্রদর্শনের জন্য রিইউজেবল প্রোডাক্ট কার্ড কম্পোনেন্ট।
import ProductCard from "@/components/ProductCard";

// পেজের মেটাডেটা (এস.ই.ও)।
export const metadata: Metadata = {
  title: "NodeCommerce — High-Performance B2C Shopping",
  description: "Experience the ultimate shopping platform.",
};

export const dynamic = "force-dynamic";

// ─── সার্ভার কম্পোনেন্ট (Server Component) ──────────────
export default async function HomePage() {
  const session = await getSession();
  let categories: any[] = [];
  let serializedNewProducts: any[] = [];

  // db.query প্রমিসগুলোতে সরাসরি .catch(()=>null) যোগ করা হচ্ছে।
  // এটি নিশ্চিত করে যে pg ড্রাইভারের AggregateError (ECONNREFUSED)
  // Next.js-এর এরর বাউন্ডারিতে পৌঁছানোর আগেই ধরা পড়বে।
  // ক্যাটাগরি ফেচ — parent_category_id IS NULL মানে টপ-লেভেল ক্যাটাগরি
  const categoriesRes = await db.query('SELECT * FROM category WHERE parent_category_id IS NULL ORDER BY name ASC LIMIT 6').catch(() => null);

  // নতুন প্রোডাক্ট ফেচ করা — N+1 সমস্যা এড়াতে json_agg ব্যবহার (একটি কুয়েরিতেই সব ডেটা)
  // product_variant তে price_override কলাম নেই — base_price থেকে নেওয়া হচ্ছে
  const newProductsRes = await db.query(`
    SELECT p.*,
           c.name as category_name,
           (SELECT COUNT(*) FROM review r WHERE r.product_id = p.product_id) as reviews_count,
           (
             SELECT m.image_url
             FROM media m 
             JOIN product_variant pv ON m.variant_code = pv.variant_code
             WHERE pv.product_id = p.product_id 
             LIMIT 1
           ) as image_url,
           (
             SELECT json_agg(json_build_object(
               'color', v.color,
               'size', v.size,
               'sku', v.sku,
               'price_override', NULL,
               'quantity', v.quantity
             ))
             FROM product_variant v
             WHERE v.product_id = p.product_id
           ) as variants
    FROM product p
    LEFT JOIN category c ON p.category_id = c.category_id
    WHERE p.is_active = true
    ORDER BY p.created_at DESC
    LIMIT 4
  `).catch(() => null);

  if (categoriesRes) {
    categories = categoriesRes.rows;
  }

  // ডেটা সিরিয়ালাইজেশন: PostgreSQL এর NUMERIC ও BIGINT TypeScript/JSON এ পাস করার আগে রূপান্তর করতে হয়
  if (newProductsRes) {
    serializedNewProducts = newProductsRes.rows.map((row: any) => ({
      ...row,
      // base_price না থাকলে পুরনো price কলাম ব্যবহার করা
      base_price: (row.base_price ?? row.price)?.toString(),
      category: row.category_name ? { name: row.category_name } : null,
      _count: { reviews: Number(row.reviews_count ?? 0) },
      variants: (row.variants || []).map((v: any) => ({
        ...v,
        price_override: v.price_override ? v.price_override.toString() : null
      }))
    }));
  }

  // ৩. ইউজার ইন্টারফেস (User Interface - UI):
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 60, minHeight: "100vh" }}>
        
        {/* হিরো সেকশন (Hero Section) - পেজের মূল ব্যানার */}
        <section style={{ 
          position: "relative", padding: "120px 24px 80px", 
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          overflow: "hidden" 
        }}>
          {/* Background Image */}
          <div style={{ position: "absolute", inset: 0, zIndex: -2 }}>
            <Image
              src="/modern-man-casual-outfit-showing-shopping-bag-okay-sign-winking-camera-recommending-shop_1258-300002.avif"
              alt="NodeCommerce Cover"
              fill
              style={{ objectFit: "cover", objectPosition: "center", opacity: 0.3 }}
              priority
            />
          </div>
          {/* Gradient Overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(22,22,31,0.1) 0%, rgba(22,22,31,1) 100%)", zIndex: -1 }} />

          {/* ব্যাকগ্রাউন্ড ইফেক্ট (Background Effects) */}
          <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 800, height: 800, background: "radial-gradient(circle, rgba(234,179,8,0.2) 0%, transparent 70%)", zIndex: 0 }} />
          
          <div style={{ position: "relative", zIndex: 1, padding: "8px 16px", borderRadius: 50, background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", color: "#eab308", fontSize: 13, fontWeight: 600, marginBottom: 24, letterSpacing: 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 11 2 2-2 2-2-2 2-2Z"/><path d="M22 13a10 10 0 0 0-20 0"/><path d="m9.5 9.5-3-3"/><path d="m14.5 9.5 3-3"/></svg> NEW COLLECTION 2026
          </div>
          <h1 style={{ position: "relative", zIndex: 1, fontFamily: "Outfit, sans-serif", fontWeight: 900, fontSize: "clamp(48px, 8vw, 72px)", color: "white", lineHeight: 1.1, marginBottom: 24, maxWidth: 900 }}>
            Elevate Your <span className="gradient-text">Lifestyle</span> with NodeCommerce.
          </h1>
          <p style={{ position: "relative", zIndex: 1, color: "rgba(255,255,255,0.7)", fontSize: 18, maxWidth: 600, marginBottom: 40, lineHeight: 1.6 }}>
            Discover our curated collection of premium products. Built with robust architecture, guaranteeing ACID-compliant seamless transactions.
          </p>
          <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 16 }}>
            {/* শপ নাও বাটন (Shop Now Button) */}
            <Link href="/products" style={{ 
              padding: "16px 32px", background: "linear-gradient(135deg, #eab308, #ca8a04)", 
              border: "none", borderRadius: 14, color: "white", fontFamily: "Outfit, sans-serif", 
              fontWeight: 700, fontSize: 16, textDecoration: "none",
              boxShadow: "0 10px 30px rgba(234,179,8,0.3)" 
            }}>
              Shop Now
            </Link>
            {/* ক্রিয়েট অ্যাকাউন্ট বাটন (Create Account Button) */}
            {!session ? (
              <Link href="/register" style={{ 
                padding: "16px 32px", background: "rgba(255,255,255,0.05)", 
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: "white", 
                fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16, textDecoration: "none",
              }}>
                Create Account
              </Link>
            ) : (
              <Link href={["admin", "super_admin"].includes(session.role) ? "/admin" : "/account"} style={{ 
                padding: "16px 32px", background: "rgba(255,255,255,0.05)", 
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: "white", 
                fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16, textDecoration: "none",
              }}>
                My Account
              </Link>
            )}
          </div>
        </section>

        {/* ক্যাটাগরি লিস্ট (Categories) */}
        <section className="container" style={{ padding: "60px 24px" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 32, color: "white", marginBottom: 32, textAlign: "center" }}>
            Shop by Category
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            {categories.map((c, i) => {
              const catName = c.name.toLowerCase();
              let imgSrc = "/demo/phone.jpg"; // fallback
              if (catName.includes('beauty')) imgSrc = "/demo/serum.jpg";
              if (catName.includes('electronics')) imgSrc = "/demo/laptop.jpg";
              if (catName.includes('fashion')) imgSrc = "/demo/shirt.jpg";
              if (catName.includes('footwear')) imgSrc = "/demo/shoes.jpg";
              if (catName.includes('gaming')) imgSrc = "/demo/controller.jpg";
              if (catName.includes('home')) imgSrc = "/demo/mug.jpg";

              return (
                <Link key={c.category_id} href={`/products?category=${c.category_id}`} style={{
                  position: "relative",
                  padding: "32px 20px", background: "rgba(22,22,31,0.6)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 20, textAlign: "center", textDecoration: "none", transition: "all 0.3s ease",
                  overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  minHeight: "180px"
                }}>
                  <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
                    <Image src={imgSrc} alt={c.name} fill style={{ objectFit: "cover", opacity: 0.4 }} />
                  </div>
                  <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "linear-gradient(to top, rgba(22,22,31,1) 0%, rgba(22,22,31,0.1) 100%)" }} />
                  
                  <div style={{ position: "relative", zIndex: 1, color: "white", fontWeight: 700, fontSize: 18, marginTop: "auto" }}>
                    {c.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* নতুন কালেকশন বা নিউ অ্যারাইভালস (New Arrivals) */}
        <section className="container" style={{ padding: "60px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <div>
              <div style={{ color: "#eab308", fontWeight: 700, fontSize: 13, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Just Dropped</div>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 32, color: "white" }}>New Arrivals</h2>
            </div>
            <Link href="/products" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
              View All →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {/* প্রোডাক্ট কার্ডগুলো রেন্ডার করা (Render Product Cards) */}
            { }
            {serializedNewProducts.map((p: any) => <ProductCard key={p.product_id} product={p} />)}
          </div>
        </section>

        {/* ফিচার ব্যানার (Features Banner) */}
        <section style={{ background: "rgba(22,22,31,0.8)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "80px 24px", marginTop: 40 }}>
          <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40, textAlign: "center" }}>
            {[
              { i: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>, t: "Fast Delivery", d: "Get your products delivered quickly with our premium couriers." },
              { i: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, t: "Secure Checkout", d: "100% ACID compliant secure transactions protecting your data." },
              { i: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, t: "Quality Guarantee", d: "30-day money-back guarantee on all our products." },
            ].map(f => (
              <div key={f.t}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>{f.i}</div>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 20, marginBottom: 10 }}>{f.t}</h3>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, lineHeight: 1.6 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </section>
        
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
এই ফাইলটি (`src/app/page.tsx`) ই-কমার্স সাইটের ল্যান্ডিং পেজ (Landing Page)। এটি একটি সার্ভার-সাইড রেন্ডারড (SSR) কম্পোনেন্ট, যা এসইও এর জন্য খুবই উপযোগী। পেজ লোড হওয়ার আগেই সার্ভার থেকে ডাটাবেসের লেটেস্ট ক্যাটাগরি এবং নতুন প্রোডাক্টগুলো ফেচ করে আনা হয়। এখানে ডায়নামিক এসকিউএল (SQL) কুয়েরি ব্যবহার করে রিলেশনাল ডেটা (যেমন প্রোডাক্টের ভ্যারিয়েন্ট এবং রিভিউ কাউন্ট) একত্রিত করা হয়েছে।

২. অপ্টিমাইজেশন (Query Optimization):
নতুন প্রোডাক্টগুলো ফেচ করার সময় "N+1 Query Problem" (যেখানে প্রতি প্রোডাক্টের জন্য আলাদা করে ভ্যারিয়েন্ট বা রিভিউ ফেচ করতে হয়) এড়ানোর জন্য `json_agg` এবং `json_build_object` ফাংশনগুলো ব্যবহার করা হয়েছে। এটি ডাটাবেস ইঞ্জিনকে নির্দেশ দেয় যাতে সে জয়েন করা বা সাব-কুয়েরি করা ডেটাগুলোকে একটি JSON অ্যারে হিসেবে রিটার্ন করে। ফলে একাধিক রিকোয়েস্টের বদলে মাত্র ১টি ডাটাবেস ট্রিপেই (Database Trip) প্রয়োজনীয় সকল ডেটা পাওয়া যায়।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
ডাটাবেস থেকে প্রাপ্ত `numeric` (Postgres এ Decimal) এবং `bigint` (Count) ডেটাগুলো রিঅ্যাক্ট ক্লায়েন্ট কম্পোনেন্টে সরাসরি পাঠানো যায় না, কারণ JSON.stringify সেগুলোকে সাপোর্ট করে না। তাই `serializedNewProducts` ভ্যারিয়েবলের মাধ্যমে সেগুলোকে `String` এবং `Number` এ কাস্ট করে সিরিয়ালাইজেশন বাউন্ডারি (Serialization Boundary) মেইনটেইন করা হয়েছে। এরপর ডেটাগুলোকে প্রপস (Props) হিসেবে `ProductCard` কম্পোনেন্টে পাঠানো হয়।
================================================================================
*/
