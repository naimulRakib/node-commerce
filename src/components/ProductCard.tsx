// এই কম্পোনেন্টটি ইউজার ইন্টারঅ্যাকশন (Hover Effects) পরিচালনা করে, তাই এটি একটি 'Client Component'।
"use client";

import Link from "next/link";
import Image from "next/image";

type ProductWithDetails = any;

// ─── প্রোডাক্ট কার্ড কম্পোনেন্ট (Product Card Component) ────────────────────────────────────────
// এটি ই-কমার্স স্টোরফ্রন্টে (Storefront) একটি একক প্রোডাক্টের প্রিভিউ (Preview) দেখায়।
export default function ProductCard({ product }: { product: ProductWithDetails }) {
  // ১. ইনভেন্টরি ক্যালকুলেশন (Inventory Calculation):
  // প্রোডাক্টের সবগুলো ভ্যারিয়েন্টের (Variant) কোয়ান্টিটি যোগ করে মোট স্টক বের করা।
  const stock = product.variants.reduce((acc: number, v: any) => acc + v.quantity, 0);
  const isOutOfStock = stock === 0; // স্টক ০ হলে Out of Stock.

  // ২. ডাইনামিক প্রাইসিং (Dynamic Pricing):
  // যদি প্রোডাক্টের ভ্যারিয়েন্ট থাকে, তবে সবচেয়ে কম দামের ভ্যারিয়েন্টটি (Minimum Price) খুঁজে বের করা।
  // অন্যথায় বেস প্রাইস (base_price) ব্যবহার করা।
  const price = product.variants.length > 0 
    ? Math.min(...product.variants.map((v: any) => Number(v.price_override ?? product.base_price)))
    : Number(product.base_price);

  return (
    <Link href={`/products/${product.product_id}`} style={{
      display: "flex", flexDirection: "column", textDecoration: "none",
      background: "rgba(22,22,31,0.6)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 20, overflow: "hidden", 
      transition: "transform 0.2s ease, border-color 0.2s ease", // হোভার অ্যানিমেশন (Hover Animation)
      cursor: "pointer"
    }} 
    // হোভার (Hover) ইভেন্ট হ্যান্ডলার: মাউস আনলে কার্ডটি সামান্য উপরে উঠবে এবং বর্ডার কালার পরিবর্তন হবে।
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.borderColor = "rgba(234,179,8,0.3)";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
    }}>
      
      {/* 1. ইমেজ / থাম্বনেইল প্লেসহোল্ডার (Image/Thumbnail Placeholder) */}
      <div style={{
        height: 240, position: "relative",
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80,
        overflow: "hidden"
      }}>
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name || "Product"} fill style={{ objectFit: "cover" }} />
        ) : (
          <Image src={
            product.category?.name?.toLowerCase().includes("laptop") ? "/demo/laptop.jpg" : 
            product.category?.name?.toLowerCase().includes("phone") ? "/demo/phone.jpg" :
            product.category?.name?.toLowerCase().includes("audio") ? "/demo/headphones.jpg" :
            product.category?.name?.toLowerCase().includes("fashion") ? "/demo/shirt.jpg" :
            "/demo/mug.jpg"
          } alt={product.name || "Product"} fill style={{ objectFit: "cover", opacity: 0.8 }} />
        )}
        
        {/* 'Out of Stock' ব্যাজ */}
        {isOutOfStock && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(239,68,68,0.9)", color: "white",
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
            backdropFilter: "blur(4px)" // গ্লাস ইফেক্ট (Glassmorphism)
          }}>
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* 2. প্রোডাক্ট ডিটেইলস (Product Details) */}
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          {/* ক্যাটাগরি নাম */}
          <div style={{ fontSize: 12, color: "#eab308", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {product.category?.name || "Uncategorized"}
          </div>
          {/* রিভিউ কাউন্ট (Review Count) */}
          {product._count.reviews > 0 && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#eab308" }}>★</span> {product._count.reviews}
            </div>
          )}
        </div>
        
        {/* প্রোডাক্টের নাম (Product Name) */}
        <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 8, lineHeight: 1.3 }}>
          {product.name}
        </h3>
        
        {/* প্রাইস এবং অ্যাকশন বাটন (Price & Action Button) */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16 }}>
          <div className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 22 }}>
            ৳{price.toLocaleString()}
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#eab308", fontSize: 18
          }}>+</div>
        </div>
      </div>
    </Link>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/components/ProductCard.tsx`) ই-কমার্স ওয়েবসাইটের জন্য একটি প্রোডাক্ট কার্ড তৈরি করে। এটি ডেটা প্রপার্টি হিসেবে গ্রহণ করে (props.product) এবং তা ব্যবহারকারী-বান্ধব (User-friendly) ইউআই (UI) তে উপস্থাপন করে।

২. ডেটা প্রসেসিং (Data Processing):
- ইনভেন্টরি এগ্রিগেশন (Inventory Aggregation): ডাটাবেসে প্রোডাক্টের বিভিন্ন ভ্যারিয়েন্টের (যেমন: লাল, নীল) আলাদা স্টক থাকে। `reduce` ফাংশন ব্যবহার করে ক্লায়েন্ট-সাইডে সেগুলোকে যোগ করে মোট স্টক হিসাব করা হয় এবং প্রোডাক্টটি 'Out of Stock' কি না তা নির্ণয় করা হয়।
- প্রাইস ডিসকভারি (Price Discovery): যদি ভ্যারিয়েন্টের আলাদা দাম থাকে (Price Overrides), তবে `Math.min` ব্যবহার করে 'Starting from...' বা সর্বনিম্ন দামটি কার্ডে দেখানো হয়, যা মার্কেটিং সাইকোলজিতে খুব কার্যকরী।

৩. মাইক্রো-ইন্টারঅ্যাকশন (Micro-interactions):
জাভাস্ক্রিপ্ট এর `onMouseOver` এবং `onMouseOut` ইভেন্ট ব্যবহার করে কার্ডে একটি ডাইনামিক হোভার ইফেক্ট (Hover effect) যুক্ত করা হয়েছে। এটি কার্ডটিকে ৩ডি (3D) স্পেসে সামান্য উপরে তুলে ধরে, যা ইউজারকে ক্লিক করতে উৎসাহিত করে (Call to Action - CTA)।
================================================================================
*/
