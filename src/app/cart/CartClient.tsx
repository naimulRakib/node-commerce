// এই নির্দেশিকাটি (directive) নেক্সট.জেএস (Next.js) কে অবহিত করে যে এই ফাইলটি একটি ক্লায়েন্ট কম্পোনেন্ট (Client Component) 
// এবং এটি ব্রাউজারের অভ্যন্তরে (Browser environment) রেন্ডার (render) হবে, সার্ভারে নয়।
"use client";

// রিয়েক্ট (React) লাইব্রেরি থেকে 'useState' হুক (hook) ইমপোর্ট করা হচ্ছে, যা লোকাল স্টেট (Local State) পরিচালনার জন্য ব্যবহৃত হয়।
import { useState } from "react";
// ক্লায়েন্ট-সাইড নেভিগেশনের জন্য 'Link' কম্পোনেন্টটি ইমপোর্ট করা হচ্ছে।
import Link from "next/link";
import Image from "next/image";
// কার্টের আইটেম আপডেট (Update) এবং মুছে ফেলার (Remove) জন্য সার্ভার অ্যাকশন (Server Actions) ইমপোর্ট করা হচ্ছে।
import { updateCartItemAction, removeCartItemAction } from "@/actions/cart";
// কুপন ভ্যালিডেশন (Coupon Validation) বা ডিসকাউন্ট কোড যাচাই করার সার্ভার অ্যাকশন ইমপোর্ট করা হচ্ছে।
import { validateCouponAction } from "@/actions/cart";

// কার্ট আইটেমের টাইপ ডেফিনেশন (Type Definition)। এটি টাইপস্ক্রিপ্টকে (TypeScript) অবজেক্টের গঠন (Data Structure) সম্পর্কে সচেতন করে।
type CartItem = {
  cart_item_id: number;
  quantity: number;
  product: { product_id: number; name: string; base_price: number; image_url: string | null };
  variant: { variant_code: string; color: string | null; size: string | null; price_override: number | null } | null;
};

// এটি মূল ক্লায়েন্ট কম্পোনেন্ট। এটি প্রপস (Props) হিসেবে সার্ভার থেকে প্রাপ্ত 'items' গ্রহণ করে।
export default function CartClientPage({ items }: { items: CartItem[] }) {
  // কার্টের আইটেমগুলোকে রিয়েক্টিভ স্টেট (Reactive State) এ সংরক্ষণ করা হচ্ছে।
  const [cartItems, setCartItems] = useState(items);
  // কুপন কোড ইনপুটের স্টেট।
  const [couponCode, setCouponCode] = useState("");
  // কুপন সম্পর্কিত ফিডব্যাক (Feedback Message) প্রদর্শনের স্টেট।
  const [couponMsg, setCouponMsg] = useState("");
  const [couponError, setCouponError] = useState(false);
  // মোট ডিসকাউন্টের পরিমাণ (Discount Amount) সংরক্ষণের স্টেট।
  const [discount, setDiscount] = useState(0);
  // কোন আইটেমটি বর্তমানে আপডেট হচ্ছে তার আইডি (Loading State) সংরক্ষণের জন্য।
  const [loading, setLoading] = useState<number | null>(null);

  // কার্টের সকল আইটেমের মোট মূল্য (Subtotal) গাণিতিক 'reduce' ফাংশন ব্যবহার করে হিসাব করা হচ্ছে।
  const subtotal = cartItems.reduce((sum, item) => {
    // যদি ভ্যারিয়েন্টের নিজস্ব মূল্য (price override) থাকে তবে সেটি, অন্যথায় পণ্যের মূল মূল্য (base price) ব্যবহৃত হবে।
    const price = item.variant?.price_override ?? item.product.base_price;
    return sum + price * item.quantity;
  }, 0);
  
  // শিপিং চার্জ নির্ধারণ: সাবটোটাল ৯৯৯ বা তার বেশি হলে ফ্রি শিপিং, অন্যথায় ৬০ টাকা চার্জ প্রযোজ্য (Business Logic)।
  const shippingFee = subtotal >= 999 ? 0 : 60;
  // চূড়ান্ত প্রদেয় মূল্য (Total Amount) নির্ধারণ।
  const total = subtotal - discount + shippingFee;

  // পণ্যের পরিমাণ (Quantity) পরিবর্তনের জন্য অ্যাসিনক্রোনাস (Asynchronous) ফাংশন।
  async function handleQtyChange(itemId: number, newQty: number) {
    // যে আইটেমটি আপডেট হচ্ছে তার জন্য লোডিং স্টেট সক্রিয় করা।
    setLoading(itemId);
    
    if (newQty < 1) {
      // যদি পরিমাণ ১ এর নিচে নামানো হয়, তবে আইটেমটি কার্ট থেকে সম্পূর্ণ মুছে ফেলার (Delete) সার্ভার অ্যাকশন কল করা হয়।
      await removeCartItemAction(itemId);
      // লোকাল স্টেট থেকে উক্ত আইটেমটি ফিল্টার (Filter) করে বাদ দেওয়া হচ্ছে।
      setCartItems(prev => prev.filter(i => i.cart_item_id !== itemId));
    } else {
      // অন্যথায়, নতুন পরিমাণ ডাটাবেসে আপডেট (Update) করার জন্য সার্ভার অ্যাকশন কল করা হয়।
      await updateCartItemAction(itemId, newQty);
      // লোকাল স্টেটে উক্ত আইটেমের পরিমাণ (Quantity) মিউটেট (Mutate) করা হচ্ছে।
      setCartItems(prev => prev.map(i => i.cart_item_id === itemId ? { ...i, quantity: newQty } : i));
    }
    // প্রসেসিং শেষে লোডিং স্টেট নিষ্ক্রিয় করা।
    setLoading(null);
  }

  // কুপন কোড যাচাইকরণের অ্যাসিনক্রোনাস ফাংশন।
  async function handleApplyCoupon() {
    if (!couponCode) return;
    
    // সার্ভার অ্যাকশনের মাধ্যমে কুপনের বৈধতা (Validation) এবং সাবটোটালের ওপর ভিত্তি করে ডিসকাউন্ট চেক করা হচ্ছে।
    const result = await validateCouponAction(couponCode.toUpperCase(), subtotal);
    
    if (result.valid && result.discountAmount !== undefined) {
      // কুপন বৈধ হলে ডিসকাউন্ট স্টেট আপডেট করা।
      setDiscount(result.discountAmount);
      setCouponMsg(`Coupon applied! Saving ৳${result.discountAmount.toLocaleString()}`);
      setCouponError(false);
    } else {
      // কুপন অবৈধ হলে ত্রুটি বার্তা (Error Message) প্রদর্শন এবং ডিসকাউন্ট শূন্য করা।
      setCouponMsg(result.error || "Invalid coupon");
      setCouponError(true);
      setDiscount(0);
    }
  }

  // যদি কার্টে কোনো আইটেম না থাকে (Empty State), তবে একটি ডিফল্ট (Default) বার্তা দেখানো হবে।
  if (cartItems.length === 0) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg></div>
        <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", marginBottom: 12 }}>Your cart is empty</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>Add some products to get started!</p>
        <Link href="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  // ইন্টারঅ্যাক্টিভ ইউজার ইন্টারফেস (Interactive UI) রেন্ডার করার অংশ।
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>
      {/* কার্ট আইটেমগুলোর তালিকা প্রদর্শনের অংশ */}
      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cartItems.map((item) => {
            const price = item.variant?.price_override ?? item.product.base_price;
            return (
              <div key={item.cart_item_id} style={{
                background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16, padding: 20, display: "flex", gap: 20, alignItems: "center",
              }}>
                {/* পণ্যের আইকন বা ছবি প্রদর্শনের প্লেসহোল্ডার */}
                <div style={{
                  width: 80, height: 80, borderRadius: 12,
                  background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, flexShrink: 0,
                  position: "relative", overflow: "hidden",
                }}>
                  {item.product.image_url ? (
                    <Image src={item.product.image_url} alt={item.product.name} fill style={{ objectFit: "cover" }} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  )}
                </div>

                {/* পণ্যের নাম এবং ভ্যারিয়েন্ট সম্পর্কিত তথ্যাবলি */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "white", fontSize: 15, marginBottom: 4 }}>
                    {item.product.name}
                  </div>
                  {item.variant && (
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 8 }}>
                      {item.variant.color && `Color: ${item.variant.color}`}
                      {item.variant.size && ` • Size: ${item.variant.size}`}
                    </div>
                  )}
                  {/* আইটেমের সর্বমোট মূল্য (Unit Price * Quantity) */}
                  <div className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 18 }}>
                    ৳{(price * item.quantity).toLocaleString()}
                  </div>
                </div>

                {/* পণ্যের পরিমাণ হ্রাস-বৃদ্ধি (Quantity Adjustment) করার নিয়ন্ত্রণ প্যানেল */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10,
                  }}>
                    {/* পরিমাণ কমানোর বাটন */}
                    <button onClick={() => handleQtyChange(item.cart_item_id, item.quantity - 1)}
                      disabled={loading === item.cart_item_id}
                      style={{ width: 36, height: 36, background: "none", border: "none", color: "white", fontSize: 16, cursor: "pointer" }}>−</button>
                    <span style={{ width: 28, textAlign: "center", color: "white", fontWeight: 600, fontSize: 14 }}>{item.quantity}</span>
                    {/* পরিমাণ বাড়ানোর বাটন */}
                    <button onClick={() => handleQtyChange(item.cart_item_id, item.quantity + 1)}
                      disabled={loading === item.cart_item_id}
                      style={{ width: 36, height: 36, background: "none", border: "none", color: "white", fontSize: 16, cursor: "pointer" }}>+</button>
                  </div>
                  {/* আইটেমটি মুছে ফেলার (Delete/Trash) বাটন */}
                  <button onClick={() => handleQtyChange(item.cart_item_id, 0)}
                    style={{ width: 36, height: 36, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#f87171", cursor: "pointer", fontSize: 16 }}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* অর্ডারের সারাংশ (Order Summary) প্রদর্শনের প্যানেল */}
      <div style={{
        background: "rgba(22,22,31,0.9)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20, padding: 28, position: "sticky", top: 100,
      }}>
        <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 22, color: "white", marginBottom: 24 }}>
          Order Summary
        </h2>

        {/* খরচের বিশ্লেষণ (Cost Breakdown) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Subtotal ({cartItems.length} items)</span>
            <span style={{ color: "white", fontWeight: 600 }}>৳{subtotal.toLocaleString()}</span>
          </div>
          {/* যদি ডিসকাউন্ট থাকে, তবে তা প্রদর্শন করা হবে */}
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#4ade80", fontSize: 14 }}>Coupon Discount</span>
              <span style={{ color: "#4ade80", fontWeight: 600 }}>−৳{discount.toLocaleString()}</span>
            </div>
          )}
          {/* শিপিং চার্জ প্রদর্শন */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Shipping Fee</span>
            <span style={{ color: shippingFee === 0 ? "#4ade80" : "white", fontWeight: 600 }}>
              {shippingFee === 0 ? "FREE" : `৳${shippingFee}`}
            </span>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
          {/* চূড়ান্ত প্রদেয় মূল্য (Grand Total) */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Total</span>
            <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 22 }}>
              ৳{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* কুপন কোড (Coupon Code) প্রবেশের ইনপুট ফিল্ড */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              style={{
                flex: 1, padding: "10px 14px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 10, color: "white", fontSize: 14, outline: "none",
              }}
            />
            {/* কুপন প্রয়োগ করার বাটন */}
            <button id="apply-coupon-btn" onClick={handleApplyCoupon} style={{
              padding: "10px 16px", background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.3)", borderRadius: 10,
              color: "#eab308", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>Apply</button>
          </div>
          {/* কুপনের ফলাফল (Success/Error Message) প্রদর্শন */}
          {couponMsg && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 12, marginTop: 8, color: couponError ? "#f87171" : "#4ade80" }}>
              {couponError ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              )}
              {couponMsg}
            </p>
          )}
        </div>

        {/* চেকআউট (Checkout) পৃষ্ঠায় যাওয়ার লিংক */}
        <Link href="/checkout" style={{
          display: "block", textAlign: "center", padding: "16px",
          background: "linear-gradient(135deg, #eab308, #ca8a04)",
          borderRadius: 14, color: "white",
          fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16,
          textDecoration: "none",
        }}>
          Proceed to Checkout →
        </Link>

        {/* কেনাকাটা চালিয়ে যাওয়ার (Continue Shopping) লিংক */}
        <Link href="/products" style={{
          display: "block", textAlign: "center", marginTop: 12, fontSize: 14,
          color: "rgba(255,255,255,0.4)", textDecoration: "none",
        }}>
          ← Continue Shopping
        </Link>

        {/* নিরাপত্তা ও পেমেন্টের নির্দেশক আইকন (Security Indicators) */}
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 8 }}>
          {[<svg key="card" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>, "📱", "🏦"].map((icon, i) => (
            <span key={i} style={{ fontSize: 18 }}>{icon}</span>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>
          Secure checkout • SSL encrypted
        </p>
      </div>
    </div>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/cart/CartClient.tsx`) একটি ক্লায়েন্ট-সাইড কম্পোনেন্ট (Client-Side Component) যা ব্যবহারকারীর কার্ট ইন্টারঅ্যাকশনগুলো পরিচালনা করে। এটি 'React' এর 'useState' হুক (Hook) ব্যবহার করে কার্টের লোকাল স্টেট (Local State) মেইনটেইন করে। যখন ব্যবহারকারী পণ্যের পরিমাণ (Quantity) পরিবর্তন করে বা কোনো আইটেম মুছে ফেলে, তখন এটি লোকাল স্টেট আপডেট করার পাশাপাশি নেক্সট.জেএস (Next.js) এর সার্ভার অ্যাকশন (Server Actions) কল করে ডাটাবেসের সাথে সিঙ্ক্রোনাইজেশন (Synchronization) সম্পন্ন করে। এখানে গাণিতিক অ্যালগরিদম (Mathematical Algorithm) যেমন `reduce` ব্যবহার করে সাবটোটাল এবং শর্তসাপেক্ষ লজিক (Conditional Logic) ব্যবহার করে শিপিং চার্জ নির্ধারণ করা হয়েছে।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
যদিও এটি একটি ক্লায়েন্ট কম্পোনেন্ট এবং সরাসরি প্রমাণীকরণ (Authentication) পরিচালনা করে না, তবে এটি যে সার্ভার অ্যাকশনগুলো (`updateCartItemAction`, `removeCartItemAction`, `validateCouponAction`) কল করে, সেগুলো স্বয়ংক্রিয়ভাবে ব্যাকএন্ডে সেশন ভ্যালিডেশন (Session Validation) করে থাকে। অর্থাৎ, কোনো ক্ষতিকর স্ক্রিপ্ট (Malicious Script) যদি ক্লায়েন্ট-সাইড থেকে অননুমোদিত রিকোয়েস্ট পাঠায়, সার্ভার অ্যাকশনগুলো তা প্রতিহত করবে (Backend Security Enforcement)।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই কম্পোনেন্টটি সনাতন (Traditional) REST API এন্ডপয়েন্টের পরিবর্তে আধুনিক নেক্সট.জেএস 'Server Actions' ব্যবহার করে। ব্যবহারকারীর ইনপুট (যেমন: বাটন ক্লিক) সরাসরি রিমোট প্রসিডিউর কল (Remote Procedure Call - RPC) এর মতো কাজ করে ব্যাকএন্ড ফাংশনগুলোকে ইনভোক (Invoke) করে। ডেটা প্রবাহ এখানে দ্বিমুখী (Bidirectional): সার্ভার থেকে প্রারম্ভিক ডেটা (Initial Data) প্রপস (Props) হিসেবে আসে এবং ক্লায়েন্টের ইন্টারঅ্যাকশনের পর আপডেটগুলো সার্ভার অ্যাকশনের মাধ্যমে ডাটাবেসে প্রেরিত হয়। এই পদ্ধতিটি লেটেন্সি (Latency) কমায় এবং ক্লায়েন্ট-সার্ভার ডেটা সিঙ্ক্রোনাইজেশনকে (Data Synchronization) আরও নিরবচ্ছিন্ন (Seamless) করে।
================================================================================
*/
