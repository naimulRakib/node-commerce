import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { requireCustomer } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "My Wishlist — NodeCommerce" };

export default async function WishlistPage() {
  const session = await requireCustomer();

  const itemsRes = await db.query(`
    SELECT i.*, 
           p.name as product_name, p.base_price,
           c.name as category_name,
           v.color as variant_color, v.size as variant_size, NULL::numeric as price_override,
           (
             SELECT m.image_url
             FROM media m
             JOIN product_variant pv ON m.variant_code = pv.variant_code
             WHERE pv.product_id = p.product_id
             LIMIT 1
           ) as image_url
    FROM wishlist_item i
    JOIN wishlist w ON i.wishlist_id = w.wishlist_id
    JOIN product p ON i.product_id = p.product_id
    LEFT JOIN category c ON p.category_id = c.category_id
    LEFT JOIN product_variant v ON i.variant_code = v.variant_code
    WHERE w.customer_id = $1
    ORDER BY i.added_at DESC
  `, [session.id]);

  const items = itemsRes.rows.map(row => ({
    id: row.wishlist_item_id,
    product: {
      product_id: row.product_id,
      name: row.product_name,
      base_price: row.base_price,
      image_url: row.image_url || null,
      category: { name: row.category_name }
    },
    variant: row.variant_code ? {
      color: row.variant_color,
      size: row.variant_size,
      price_override: row.price_override
    } : null
  }));

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 28 }}>
        My Wishlist <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>({items.length})</span>
      </h1>

      {items.length === 0 ? (
        <div style={{ background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "60px 24px", textAlign: "center" }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, marginBottom: 20 }}>Your wishlist is empty</p>
          <Link href="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {items.map((item) => {
            const price = item.variant?.price_override ?? item.product.base_price;
            return (
              <div key={item.id} style={{ background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
                <div style={{ height: 140, background: "linear-gradient(135deg, #1a1a2e, #16213e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, position: "relative" }}>
                  {item.product.image_url ? (
                    <Image src={item.product.image_url} alt={item.product.name} fill style={{ objectFit: "cover" }} />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                  )}
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>{item.product.category?.name}</div>
                  <div style={{ fontWeight: 600, color: "white", fontSize: 14, marginBottom: 8 }}>{item.product.name}</div>
                  {item.variant && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
                      {item.variant.color}{item.variant.size ? ` • ${item.variant.size}` : ""}
                    </div>
                  )}
                  <div className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
                    ৳{Number(price).toLocaleString()}
                  </div>
                  <Link href={`/products/${item.product.product_id}`} style={{
                    display: "block", textAlign: "center", padding: "10px",
                    background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)",
                    borderRadius: 10, color: "#eab308", fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}>View Product</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
