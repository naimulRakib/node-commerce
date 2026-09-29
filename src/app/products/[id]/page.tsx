// ডায়নামিক রাউটিংয়ে (Dynamic Routing) ডাটা না পাওয়া গেলে 404 পেজ দেখানোর জন্য।
import { notFound } from "next/navigation";
// এসইও (SEO) এর জন্য মেটাডেটা ইন্টারফেস।
import { Metadata } from "next";
// ক্লায়েন্ট-সাইড রাউটিং এর জন্য লিংক।
import Link from "next/link";
import Image from "next/image";
// ডেটাবেস কানেকশন।
import { db } from "@/lib/db";
// গ্লোবাল নেভিগেশন বার (Navbar)।
import Navbar from "@/components/Navbar";
// গ্লোবাল ফুটার (Footer)।
import Footer from "@/components/Footer";
// ক্লায়েন্ট-সাইড ইন্টারঅ্যাক্টিভিটি (Client-side Interactivity) এর জন্য রিঅ্যাক্ট কম্পোনেন্টগুলো (AddToCart এবং Review)।
import { AddToCartSection, ReviewSection } from "./ProductClientComponents";

// ডায়নামিক রাউট প্যারামিটার টাইপ ডিফাইন করা হচ্ছে (উদা: /products/123 -> id = 123)।
type Props = { params: Promise<{ id: string }> };

// ─── ডায়নামিক মেটাডেটা জেনারেশন (Dynamic Metadata Generation) ──────────────
// এসইও (SEO) অপ্টিমাইজেশনের জন্য পেজ লোড হওয়ার আগেই সার্ভারে প্রোডাক্টের নাম ও ডেসক্রিপশন ফেচ করা হয়।
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const res = await db.query('SELECT name, description FROM product WHERE product_id = $1', [Number(id)]);
  const product = res.rows[0];
  return {
    title: product ? `${product.name} — NodeCommerce` : "Product — NodeCommerce",
    description: product?.description ?? undefined,
  };
}

// ─── সার্ভার কম্পোনেন্ট (Server Component) ──────────────────────────────
export default async function ProductDetailPage({ params }: Props) {
  // ১. প্যারামিটার এক্সট্র্যাকশন (Parameter Extraction):
  const { id } = await params;

  // ২. ডেটা ফেচিং (Data Fetching / Scatter-Gather Pattern):
  // প্রোডাক্টের মূল ডেটা, তার ভ্যারিয়েন্ট এবং রিভিউগুলো সমান্তরালে (Parallel) ফেচ করা হচ্ছে।
  const [productRes, variantsRes, reviewsRes] = await Promise.all([
    // প্রোডাক্ট এবং তার ক্যাটাগরির নাম (Category Name) ফেচ করা।
    db.query(`
      SELECT p.*, c.name as category_name,
             (
               SELECT m.image_url
               FROM media m 
               JOIN product_variant pv ON m.variant_code = pv.variant_code
               WHERE pv.product_id = p.product_id 
               LIMIT 1
             ) as image_url
      FROM product p
      LEFT JOIN category c ON p.category_id = c.category_id
      WHERE p.product_id = $1 AND p.is_active = true
    `, [Number(id)]),
    // প্রোডাক্টের সকল ভ্যারিয়েন্ট ফেচ করা।
    db.query('SELECT * FROM product_variant WHERE product_id = $1 ORDER BY created_at ASC', [Number(id)]),
    // প্রোডাক্টের সাম্প্রতিক ২০টি রিভিউ এবং কাস্টমারের নাম ফেচ করা।
    db.query(`
      SELECT r.*, c.name as customer_name
      FROM review r
      JOIN customer c ON r.customer_id = c.customer_id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT 20
    `, [Number(id)])
  ]);

  // যদি প্রোডাক্ট না পাওয়া যায় বা ইনঅ্যাক্টিভ হয়, তবে নেক্সট.জেএস এর ডিফল্ট 404 পেজে রিডাইরেক্ট (Redirect) করা হবে।
  if (productRes.rows.length === 0) notFound();

  // ৩. ডেটা ট্রান্সফরমেশন (Data Transformation):
  // প্রিজমা (Prisma) বা অন্যান্য ORM এর মত নেস্টেড অবজেক্ট (Nested Object) স্ট্রাকচার তৈরি করা।
  const product = {
    ...productRes.rows[0],
    category: productRes.rows[0].category_name ? { name: productRes.rows[0].category_name } : null,
    variants: variantsRes.rows,
    reviews: reviewsRes.rows.map((r: any) => ({
      ...r,
      customer: { name: r.customer_name }
    }))
  };

  // এভারেজ রেটিং (Average Rating) ক্যালকুলেশন।
  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / product.reviews.length
    : 0;

  // ৪. সিরিয়ালাইজেশন বাউন্ডারি (Serialization Boundary):
  // সার্ভার কম্পোনেন্ট থেকে ক্লায়েন্ট কম্পোনেন্টে ডেটা পাস করার সময় কোনো কমপ্লেক্স অবজেক্ট (যেমন Decimal, Date) 
  // পাঠানো যায় না। তাই সেগুলোকে Number বা String এ কাস্ট (Cast) করে একটি প্লেইন অবজেক্ট (Plain Object) তৈরি করা হচ্ছে।
  const productForClient = {
    product_id: product.product_id,
    name: product.name,
    description: product.description,
    base_price: Number(product.base_price), // Decimal থেকে Number এ রূপান্তর
    category: product.category,
    variants: product.variants.map((v: any) => ({
      variant_code: v.variant_code,
      color: v.color,
      size: v.size,
      price_override: v.price_override ? Number(v.price_override) : null,
      quantity: v.quantity,
      sku: v.sku,
    })),
    reviews: product.reviews.map((r: any) => ({
      review_id: r.review_id,
      rating: r.rating,
      comment: r.comment,
      is_verified: r.is_verified,
      created_at: new Date(r.created_at).toISOString(), // Date থেকে ISO String এ রূপান্তর
      customer: r.customer,
    })),
  };

  // ৫. ইউজার ইন্টারফেস (User Interface - UI):
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "100vh" }}>
        {/* ব্রেডক্রাম্ব (Breadcrumb) নেভিগেশন */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 0" }}>
          <div className="container" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textDecoration: "none" }}>Home</Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
            <Link href="/products" style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textDecoration: "none" }}>Products</Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{product.name}</span>
          </div>
        </div>

        <div className="container" style={{ padding: "40px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, marginBottom: 60 }}>
            
            {/* বাম অংশ: প্রোডাক্ট ইমেজ ও স্পেসিফিকেশন (Left: Product Image & Specs) */}
            <div>
              {/* প্রোডাক্ট ইমেজ এরিয়া */}
              <div style={{
                position: "relative",
                background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                borderRadius: 24, height: 420, overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}>
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill style={{ objectFit: "cover" }} />
                ) : (
                  <Image src={
                    product.category?.name?.toLowerCase().includes("laptop") ? "/demo/laptop.jpg" : 
                    product.category?.name?.toLowerCase().includes("phone") ? "/demo/phone.jpg" :
                    product.category?.name?.toLowerCase().includes("audio") ? "/demo/headphones.jpg" :
                    product.category?.name?.toLowerCase().includes("fashion") ? "/demo/shirt.jpg" :
                    "/demo/mug.jpg"
                  } alt={product.name} fill style={{ objectFit: "cover", opacity: 0.8 }} />
                )}
              </div>

              {/* প্রোডাক্ট ডিটেইলস প্যানেল (Product Details Panel) */}
              <div style={{
                marginTop: 24, background: "rgba(22,22,31,0.8)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16, padding: 20,
              }}>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 15, marginBottom: 12 }}>
                  Product Details
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Product Code</span>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "monospace" }}>{product.product_code}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Category</span>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{product.category?.name ?? "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Variants</span>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{product.variants.length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Rating</span>
                    <span style={{ color: "#f59e0b", fontSize: 13 }}>
                      {avgRating > 0 ? `${avgRating.toFixed(1)} ★ (${product.reviews.length} reviews)` : "No reviews yet"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ডান অংশ: প্রোডাক্ট ইনফো এবং অ্যাকশন (Right: Product Info & Actions) */}
            <div>
              {product.category && (
                <div className="badge badge-orange" style={{ marginBottom: 16, display: "inline-flex" }}>
                  {product.category.name}
                </div>
              )}
              {/* প্রোডাক্ট টাইটেল (Product Title) */}
              <h1 style={{
                fontFamily: "Outfit, sans-serif", fontWeight: 800,
                fontSize: 32, color: "white", marginBottom: 12, lineHeight: 1.2,
              }}>
                {product.name}
              </h1>

              {/* রেটিং ওভারভিউ (Rating Overview) */}
              {avgRating > 0 && (
                <div style={{ color: "#f59e0b", fontSize: 18, marginBottom: 20 }}>
                  {"★".repeat(Math.floor(avgRating))}
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginLeft: 8 }}>
                    {avgRating.toFixed(1)} ({product.reviews.length} reviews)
                  </span>
                </div>
              )}

              {/* প্রোডাক্ট ডেসক্রিপশন (Product Description) */}
              {product.description && (
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>
                  {product.description}
                </p>
              )}

              {/* ডেলিভারি এবং রিটার্ন বেনিফিট (Delivery + Return perks) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                {[
                  { icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>, text: "Free delivery on orders above ৳999" },
                  { icon: "↩️", text: "Easy 30-day return policy" },
                  { icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: "100% secure payment" },
                ].map((perk, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                    <span style={{ fontSize: 16 }}>{perk.icon}</span> {perk.text}
                  </div>
                ))}
              </div>

              {/* ক্লায়েন্ট কম্পোনেন্ট: ভ্যারিয়েন্ট সিলেকশন, কার্টে অ্যাড এবং প্রাইস ক্যালকুলেশন (Client Component) */}
              <AddToCartSection product={productForClient} />
            </div>
          </div>

          {/* রিভিউ সেকশন (Reviews Section): ক্লায়েন্ট কম্পোনেন্ট যেখানে রিভিউ সাবমিট করা যায় */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 48 }}>
            <ReviewSection productId={product.product_id} reviews={productForClient.reviews} />
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
এই ফাইলটি (`src/app/products/[id]/page.tsx`) একটি সিঙ্গেল প্রোডাক্টের ডিটেইল পেজ রেন্ডার করে। এটি একটি ডায়নামিক সার্ভার-সাইড রেন্ডারড (SSR) পেজ, যা URL এর `[id]` প্যারামিটারের উপর ভিত্তি করে কাজ করে। পেজটি প্রোডাক্টের বেসিক ইনফরমেশন, ভ্যারিয়েন্ট (রঙ, সাইজ) এবং কাস্টমার রিভিউ লোড করে। এরপর `AddToCartSection` এবং `ReviewSection` ক্লায়েন্ট কম্পোনেন্টগুলোতে ডেটা পাস করে।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
ডেটা ফেচিংয়ের সময় `$1` ব্যবহার করে প্যারামিটারাইজড কুয়েরি (Parameterized Query) চালানো হয়েছে, যা সরাসরি SQL Injection প্রিভেন্ট করে। এছাড়া, ইউজারকে কার্টে বা উইশলিস্টে আইটেম অ্যাড করার জন্য ক্লায়েন্ট কম্পোনেন্টের মাধ্যমে সুরক্ষিত সার্ভার অ্যাকশন কল করা হয়।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই পেজটি নেক্সট.জেএস-এর অত্যন্ত গুরুত্বপূর্ণ একটি কনসেপ্ট— "Serialization Boundary" মেইনটেইন করে। ডাটাবেস থেকে আসা অনেক ফিল্ড যেমন `numeric` বা `timestamp` রিঅ্যাক্ট ক্লায়েন্ট কম্পোনেন্ট সরাসরি রেন্ডার করতে পারে না (কারন এগুলো JSON.stringify সমর্থন করে না)। তাই `productForClient` অবজেক্টের মাধ্যমে সার্ভারে পাওয়া ডেটাগুলোকে `Number` এবং `String` এ কাস্ট করে তারপর `AddToCartSection` এ পাঠানো হয়েছে। `Promise.all` এর মাধ্যমে প্রোডাক্ট, ভ্যারিয়েন্ট এবং রিভিউ ৩টি আলাদা কুয়েরি প্যারালালি ফেচ করায় অ্যাপ্লিকেশনটি অত্যন্ত ফাস্ট (Fast) পারফর্ম করে।
================================================================================
*/
