// এটি একটি ক্লায়েন্ট কম্পোনেন্ট, তাই এটি ব্রাউজারে এক্সিকিউট (Execute) হবে।
"use client";

// রিঅ্যাক্ট স্টেট ম্যানেজমেন্ট (State Management) হুক।
import { useState } from "react";
// কার্টে (Cart) এবং উইশলিস্টে (Wishlist) আইটেম অ্যাড করার জন্য সার্ভার অ্যাকশন।
import { addToCartAction, addToWishlistAction } from "@/actions/cart";
// নতুন রিভিউ সাবমিট করার জন্য সার্ভার অ্যাকশন।
import { submitReviewAction } from "@/actions/review";

// ─── টাইপ ডেফিনিশন (Type Definition) ──────────────────────────────────────────
// প্রোডাক্ট এবং এর ভ্যারিয়েন্ট, রিভিউ ইত্যাদির জন্য একটি পূর্ণাঙ্গ টাইপ ডিফাইন করা হয়েছে।
// এটি মূলত `ProductDetailPage` সার্ভার কম্পোনেন্ট থেকে প্রপস হিসেবে আসে।
type Product = {
  product_id: number;
  name: string;
  description: string | null;
  base_price: number;
  category: { name: string } | null;
  variants: Array<{
    variant_code: string;
    color: string | null;
    size: string | null;
    price_override: number | null;
    quantity: number;
    sku: string;
  }>;
  reviews: Array<{
    review_id: number;
    rating: number;
    comment: string | null;
    is_verified: boolean;
    created_at: string;
    customer: { name: string } | null;
  }>;
};

// ─── অ্যাড টু কার্ট কম্পোনেন্ট (Add To Cart Section) ─────────────────────────
export function AddToCartSection({ product }: { product: Product }) {
  // ১. স্টেট ম্যানেজমেন্ট (State Management):
  // ডিফল্টভাবে প্রথম ভ্যারিয়েন্ট কোডটি সিলেক্ট করা থাকে।
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants[0]?.variant_code ?? null
  );
  const [qty, setQty] = useState(1); // পরিমাণের জন্য স্টেট
  const [msg, setMsg] = useState({ text: "", isError: false }); // নোটিফিকেশন মেসেজের জন্য স্টেট
  const [loading, setLoading] = useState(false); // লোডিং ইন্ডিকেটরের জন্য স্টেট

  // ২. ডেরাইভড স্টেট (Derived State):
  // ইউজারের সিলেক্ট করা ভ্যারিয়েন্টের উপর ভিত্তি করে প্রোডাক্টের স্পেসিফিক ভ্যারিয়েন্টটি খুঁজে বের করা।
  const variant = product.variants.find((v) => v.variant_code === selectedVariant);
  // যদি ভ্যারিয়েন্টে কোনো প্রাইস ওভাররাইড (Price Override) থাকে তবে সেটি ব্যবহার করা হবে, নাহলে বেস প্রাইস (Base Price)।
  const price = variant?.price_override ?? product.base_price;

  // ৩. ইভেন্ট হ্যান্ডলার্স (Event Handlers):
  
  // কার্টে অ্যাড করার ফাংশন
  async function handleAddToCart() {
    setLoading(true);
    // সার্ভার অ্যাকশনের মাধ্যমে ডাটাবেস আপডেট করা।
    const result = await addToCartAction(product.product_id, selectedVariant, qty);
    // সাকসেস বা এরর মেসেজ সেট করা।
    setMsg({ text: result.error ? result.error : "Added to cart!", isError: !!result.error });
    setLoading(false);
    // ৩ সেকেন্ড পর মেসেজ ক্লিয়ার করে দেওয়া।
    setTimeout(() => setMsg({ text: "", isError: false }), 3000);
  }

  // উইশলিস্টে অ্যাড করার ফাংশন
  async function handleWishlist() {
    const result = await addToWishlistAction(product.product_id, selectedVariant);
    setMsg({ text: result.error ? result.error : "Added to wishlist!", isError: !!result.error });
    setTimeout(() => setMsg({ text: "", isError: false }), 3000);
  }

  // ৪. ইউজার ইন্টারফেস (User Interface)
  return (
    <div>
      {/* ভ্যারিয়েন্ট সিলেকশন এরিয়া (Variant Selection Area) */}
      {product.variants.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {/* রঙের ভ্যারিয়েন্ট (Color Variants) */}
          {product.variants.some(v => v.color) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
                Color: <strong style={{ color: "white" }}>{variant?.color}</strong>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {/* Set ব্যবহার করে ডুপ্লিকেট রঙগুলো রিমুভ করে ইউনিক রঙগুলো ম্যাপ করা হচ্ছে */}
                {[...new Set(product.variants.map(v => v.color))].map(color => {
                  const v = product.variants.find(pv => pv.color === color);
                  if (!v) return null;
                  const isSelected = v.variant_code === selectedVariant;
                  return (
                    <button key={color} onClick={() => setSelectedVariant(v.variant_code)}
                      style={{
                        padding: "8px 16px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                        background: isSelected ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)",
                        border: isSelected ? "1px solid #eab308" : "1px solid rgba(255,255,255,0.1)",
                        color: isSelected ? "#eab308" : "rgba(255,255,255,0.6)", fontWeight: isSelected ? 600 : 400,
                      }}>{color}</button>
                  );
                })}
              </div>
            </div>
          )}

          {/* সাইজের ভ্যারিয়েন্ট (Size Variants) */}
          {product.variants.some(v => v.size) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
                Size: <strong style={{ color: "white" }}>{variant?.size}</strong>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {/* Set ব্যবহার করে ডুপ্লিকেট সাইজগুলো রিমুভ করা হচ্ছে */}
                {[...new Set(product.variants.map(v => v.size))].map(size => {
                  const v = product.variants.find(pv => pv.size === size);
                  if (!v) return null;
                  const isSelected = v.variant_code === selectedVariant;
                  return (
                    <button key={size} onClick={() => setSelectedVariant(v.variant_code)}
                      style={{
                        width: 48, height: 48, borderRadius: 10, fontSize: 13, cursor: "pointer",
                        background: isSelected ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)",
                        border: isSelected ? "1px solid #eab308" : "1px solid rgba(255,255,255,0.1)",
                        color: isSelected ? "#eab308" : "rgba(255,255,255,0.6)", fontWeight: isSelected ? 600 : 400,
                      }}>{size}</button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* পরিমাণ বা কোয়ান্টিটি সিলেকশন (Quantity Selection) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Qty:</span>
        <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10 }}>
          {/* কোয়ান্টিটি কমানোর বাটন, মিনিমাম ১ */}
          <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 40, height: 40, background: "none", border: "none", color: "white", fontSize: 18, cursor: "pointer" }}>−</button>
          <span style={{ width: 32, textAlign: "center", color: "white", fontWeight: 600 }}>{qty}</span>
          {/* কোয়ান্টিটি বাড়ানোর বাটন, ম্যাক্সিমাম ১০ */}
          <button onClick={() => setQty(q => Math.min(10, q + 1))} style={{ width: 40, height: 40, background: "none", border: "none", color: "white", fontSize: 18, cursor: "pointer" }}>+</button>
        </div>
        {/* লো স্টক (Low Stock) ওয়ার্নিং */}
        {variant && variant.quantity <= 5 && variant.quantity > 0 && (
          <span style={{ fontSize: 12, color: "#f87171" }}>Only {variant.quantity} left!</span>
        )}
        {/* স্টক আউট (Out of Stock) ওয়ার্নিং */}
        {variant && variant.quantity === 0 && (
          <span style={{ fontSize: 12, color: "#f87171" }}>Out of stock</span>
        )}
      </div>

      {/* ডায়নামিক প্রাইস ডিসপ্লে (Dynamic Price Display) */}
      <div className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900, fontSize: 36, marginBottom: 24 }}>
        ৳{Number(price).toLocaleString()}
      </div>

      {/* অ্যাকশন বাটনস (Action Buttons) */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {/* অ্যাড টু কার্ট বাটন (Add to Cart Button) */}
        <button
          id="add-to-cart-main"
          onClick={handleAddToCart}
          disabled={loading || (variant?.quantity === 0)} // স্টক না থাকলে ডিজেবল
          style={{
            flex: 1, padding: "16px",
            background: "linear-gradient(135deg, #eab308, #ca8a04)",
            border: "none", borderRadius: 14, color: "white",
            fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16,
            cursor: loading || variant?.quantity === 0 ? "not-allowed" : "pointer",
            opacity: variant?.quantity === 0 ? 0.5 : 1,
          }}
        >
          {loading ? "Adding..." : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              Add to Cart
            </span>
          )}
        </button>
        {/* অ্যাড টু উইশলিস্ট বাটন (Add to Wishlist Button) */}
        <button
          id="add-to-wishlist-btn"
          onClick={handleWishlist}
          style={{
            width: 52, height: 52, borderRadius: 14,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
      </div>

      {/* নোটিফিকেশন মেসেজ (Notification Message) */}
      {msg.text && (
        <div style={{
          padding: "12px 16px", borderRadius: 12,
          background: msg.isError ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          border: msg.isError ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.3)",
          color: msg.isError ? "#f87171" : "#4ade80", fontSize: 14, display: "flex", alignItems: "center", gap: 8
        }}>
          {msg.isError ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          )}
          {msg.text}
        </div>
      )}
    </div>
  );
}

// ─── রিভিউ সেকশন কম্পোনেন্ট (Review Section Component) ────────────────────────
export function ReviewSection({ productId, reviews }: {
  productId: number;
  reviews: Product["reviews"];
}) {
  // ১. রিভিউ ফর্ম স্টেট (Review Form State)
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // ২. রিভিউ সাবমিশন হ্যান্ডলার (Review Submission Handler)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // সার্ভার অ্যাকশনের মাধ্যমে রিভিউ ডাটাবেসে সেভ করা।
    const result = await submitReviewAction(productId, rating, comment);
    setMsg(result.error ?? (result.success ? "Review submitted!" : ""));
    setLoading(false);
  }

  // এভারেজ রেটিং (Average Rating) ক্যালকুলেশন।
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // ৩. ইউজার ইন্টারফেস (User Interface)
  return (
    <div>
      {/* রিভিউ হেডার (Review Header) */}
      <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 24, color: "white", marginBottom: 8 }}>
        Reviews {reviews.length > 0 && <span className="gradient-text">({reviews.length})</span>}
      </h2>
      {reviews.length > 0 && (
        <div style={{ color: "#f59e0b", fontSize: 20, marginBottom: 24 }}>
          {"★".repeat(Math.floor(avgRating))} <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>{avgRating.toFixed(1)} average</span>
        </div>
      )}

      {/* রিভিউ লিস্ট (Review List) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
        {reviews.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>No reviews yet. Be the first!</p>
        )}
        {reviews.map((r) => (
          <div key={r.review_id} style={{
            background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 20,
          }}>
            {/* রিভিউয়ারের ইনফো ও রেটিং (Reviewer Info & Rating) */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#f59e0b" }}>{"★".repeat(r.rating)}</span>
                <span style={{ fontWeight: 600, color: "white", fontSize: 14 }}>{r.customer?.name ?? "Anonymous"}</span>
                {r.is_verified && (
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 100,
                    background: "rgba(34,197,94,0.1)", color: "#4ade80",
                    border: "1px solid rgba(34,197,94,0.2)",
                  }}>✓ Verified Purchase</span>
                )}
              </div>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            {/* রিভিউ কমেন্ট (Review Comment) */}
            {r.comment && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7 }}>{r.comment}</p>}
          </div>
        ))}
      </div>

      {/* নতুন রিভিউ লেখার ফর্ম (Write Review Form) */}
      <div style={{
        background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: 24,
      }}>
        <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 20 }}>
          Write a Review
        </h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8, display: "block" }}>Your Rating</label>
            <div style={{ display: "flex", gap: 6 }}>
              {/* স্টার রেটিং সিলেকশন বাটন (Star Rating Selection Buttons) */}
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} type="button" onClick={() => setRating(r)} style={{
                  width: 40, height: 40, borderRadius: 10, fontSize: 18, cursor: "pointer",
                  background: r <= rating ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)",
                  border: r <= rating ? "1px solid rgba(234,179,8,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  color: r <= rating ? "#eab308" : "rgba(255,255,255,0.3)",
                }}>★</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8, display: "block" }}>Comment (optional)</label>
            {/* কমেন্ট বক্স (Comment Box) */}
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              style={{
                width: "100%", padding: "12px 16px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 12, color: "white", fontSize: 14, resize: "vertical", outline: "none",
              }}
              placeholder="Share your experience..."
            />
          </div>
          {/* সাবমিট বাটন (Submit Button) */}
          <button id="submit-review-btn" type="submit" disabled={loading} style={{
            padding: "12px 28px", background: "linear-gradient(135deg, #eab308, #ca8a04)",
            border: "none", borderRadius: 12, color: "white",
            fontWeight: 700, fontSize: 14, cursor: "pointer", alignSelf: "flex-start",
          }}>
            {loading ? "Submitting..." : "Submit Review"}
          </button>
          {/* সাকসেস বা এরর মেসেজ (Success or Error Message) */}
          {msg && <p style={{ fontSize: 13, color: msg.includes("error") ? "#f87171" : "#4ade80" }}>{msg}</p>}
        </form>
      </div>
    </div>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/products/[id]/ProductClientComponents.tsx`) প্রোডাক্ট ডিটেইল পেজের ইন্টারেক্টিভ (Interactive) অংশগুলো ধারণ করে। এখানে দুটি রিঅ্যাক্ট ক্লায়েন্ট কম্পোনেন্ট রয়েছে: `AddToCartSection` (যেটি ভ্যারিয়েন্ট সিলেকশন, পরিমাণ এবং প্রাইস ডায়নামিক্যালি হ্যান্ডেল করে) এবং `ReviewSection` (যেটি কাস্টমার রিভিউ লিস্টিং এবং নতুন রিভিউ সাবমিশন হ্যান্ডেল করে)।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
অ্যাকশনগুলো সম্পূর্ণ সিকিউরড (Secured)। কার্টে অ্যাড বা রিভিউ সাবমিট করার জন্য ক্লায়েন্ট-সাইড থেকে সরাসরি ডাটাবেসে রিকোয়েস্ট না পাঠিয়ে নেক্সট.জেএস-এর সিকিউরড সার্ভার অ্যাকশন (`addToCartAction`, `submitReviewAction`) ব্যবহার করা হয়েছে। এই সার্ভার অ্যাকশনগুলো ব্যাকএন্ডে (Backend) কাস্টমার লগ-ইন আছে কিনা (Session/Auth Token) তা ভেরিফাই করে তারপর ডাটাবেস আপডেট করে। 

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এখানে ডেরাইভড স্টেট (Derived State) প্যাটার্ন ব্যবহার করা হয়েছে, যেখানে ইউজার যখন কোনো নির্দিষ্ট কালার (Color) বা সাইজ (Size) সিলেক্ট করে, তখন `product.variants.find(...)` ব্যবহার করে ঐ ভ্যারিয়েন্টের স্পেসিফিক ডেটা (যেমন স্টক কোয়ান্টিটি, প্রাইস ওভাররাইড) বের করে আনা হয় এবং UI ইনস্ট্যান্টলি আপডেট হয়। সার্ভার অ্যাকশন থেকে রিটার্ন পাওয়া ডাটার মাধ্যমে ক্লায়েন্ট-সাইড নোটিফিকেশন (`msg` স্টেট) ম্যানেজ করা হয়, যা অপটিমিস্টিক ইউআই (Optimistic UI) ডিজাইনের একটি চমৎকার উদাহরণ।
================================================================================
*/
