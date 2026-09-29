// "use client" নির্দেশিকা (Directive) ব্যবহার করে নেক্সট.জেএস (Next.js) কে জানানো হচ্ছে যে 
// এটি একটি ক্লায়েন্ট কম্পোনেন্ট এবং এতে রিঅ্যাক্ট হুকস (React Hooks) ব্যবহার করা যাবে।
"use client";

// কম্পোনেন্ট লেভেলের লোকাল স্টেট (Local State) ম্যানেজ করার জন্য 'useState' হুক।
import { useState } from "react";
// সার্ভার অ্যাকশনস (Server Actions) ইম্পোর্ট করা হচ্ছে কুপন তৈরি এবং টগল করার জন্য।
import { createCouponAction, toggleCouponAction } from "@/actions/admin";

// কুপনের টাইপ ডেফিনিশন (Type Definition), যা টাইপস্ক্রিপ্টের (TypeScript) টাইপ-সেফটি (Type-safety) নিশ্চিত করে।
type Coupon = {
  code: string;
  discount_type: string;
  discount_value: number | string; // সার্ভার থেকে সিরিয়ালাইজ হয়ে আসার কারণে এটি স্ট্রিং হতে পারে।
  min_spend: number | string;
  max_discount: number | string | null;
  usage_count: number;
  usage_limit: number | null;
  expiry_date: Date | null;
  is_active: boolean;
};

// ─── ক্লায়েন্ট কম্পোনেন্ট (Client Component) ──────────────────────────────
export default function AdminCouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  // ১. স্টেট ম্যানেজমেন্ট (State Management)
  // সার্ভার থেকে আসা 'initialCoupons' প্রপস কে স্টেটে ইনিশিয়ালাইজ করা হচ্ছে।
  const [coupons, setCoupons] = useState(initialCoupons);
  // নতুন কুপন তৈরির ফর্ম (Form) দেখানো বা লুকানোর জন্য টগল স্টেট।
  const [showForm, setShowForm] = useState(false);
  // ফর্ম সাবমিশনে কোনো এরর আসলে তা সংরক্ষণের জন্য।
  const [error, setError] = useState("");
  // সার্ভার রিকোয়েস্ট চলার সময় লোডিং ইন্ডিকেটর (Loading Indicator) দেখানোর জন্য।
  const [loading, setLoading] = useState(false);

  // ২. ইভেন্ট হ্যান্ডলার্স (Event Handlers)
  
  // কুপন তৈরির ফর্ম সাবমিট হ্যান্ডলার (Submit Handler)।
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // ব্রাউজারের ডিফল্ট রিফ্রেশ প্রিভেন্ট করা হচ্ছে।
    setLoading(true);
    setError("");
    
    // ফর্ম এলিমেন্ট থেকে ডাটা এক্সট্র্যাক্ট (Extract) করে FormData অবজেক্ট তৈরি।
    const fd = new FormData(e.currentTarget);
    
    // সার্ভার অ্যাকশন কল (RPC Request)।
    const result = await createCouponAction(fd);
    
    // এরর হ্যান্ডলিং: সার্ভার থেকে কোনো এরর আসলে স্টেটে সেট করা হবে, অন্যথায় পেজ রিলোড করে নতুন ডেটা ফেচ করা হবে।
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.reload(); // রিয়েল ওয়ার্ল্ড অ্যাপে 'router.refresh()' বা লোকাল স্টেট আপডেট বেশি অপ্টিমাইজড।
    }
  }

  // কুপনের অ্যাক্টিভ স্ট্যাটাস (Active Status) টগল করার হ্যান্ডলার।
  async function handleToggle(code: string, current: boolean) {
    // সার্ভার অ্যাকশন কল করে ব্যাকএন্ডে স্ট্যাটাস আপডেট করা হচ্ছে (Optimistic Update এর বদলে Pessimistic/Awaited Update)।
    await toggleCouponAction(code, !current);
    
    // সার্ভার সাইডে আপডেট সফল হওয়ার পর ক্লায়েন্ট সাইড স্টেট (Local State) আপডেট করা হচ্ছে।
    setCoupons(prev => prev.map(c => c.code === code ? { ...c, is_active: !current } : c));
  }

  // ৩. ইউজার ইন্টারফেস (User Interface - UI)
  return (
    <div>
      {/* হেডার (Header) এবং অ্যাড বাটন (Add Button) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white" }}>
          Coupons
        </h1>
        {/* ফর্ম টগল বাটন */}
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: "11px 22px", background: showForm ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #eab308, #ca8a04)",
          border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>
          {showForm ? "Cancel" : "+ Add Coupon"}
        </button>
      </div>

      {/* কুপন ক্রিয়েশন ফর্ম (Coupon Creation Form) - কন্ডিশনাল রেন্ডারিং */}
      {showForm && (
        <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 16 }}>Create New Coupon</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* এরর মেসেজ ডিসপ্লে */}
            {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Code *</label>
                <input name="code" required placeholder="SUMMER20" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Discount Type</label>
                <select name="discount_type" style={inputStyle}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (৳)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Discount Value *</label>
                <input name="discount_value" type="number" min="1" required placeholder="e.g. 20" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Min Spend (৳) *</label>
                <input name="min_spend" type="number" min="0" required placeholder="500" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Max Discount (৳)</label>
                <input name="max_discount" type="number" min="0" placeholder="Optional limit" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Usage Limit</label>
                <input name="usage_limit" type="number" min="1" placeholder="Optional limit" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Expiry Date</label>
                <input name="expiry_date" type="datetime-local" style={inputStyle} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              alignSelf: "flex-start", padding: "12px 24px", background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.3)", borderRadius: 12, color: "#eab308", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
              {loading ? "Creating..." : "Save Coupon"}
            </button>
          </form>
        </div>
      )}

      {/* কুপন লিস্ট (Coupon List) - গ্রিড ভিউ (Grid View) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {coupons.map((coupon) => {
          // এক্সপায়ারেশন এবং ইউজেজ লিমিট ক্যালকুলেশন।
          const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
          const isExhausted = coupon.usage_limit && coupon.usage_count >= coupon.usage_limit;
          
          return (
            // কুপন কার্ড (Coupon Card)
            <div key={coupon.code} style={{
              background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20, padding: 20, opacity: coupon.is_active ? 1 : 0.6, // ইনঅ্যাক্টিভ হলে অপাসিটি কমানো হয়।
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  {/* কুপন কোড ডিসপ্লে */}
                  <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "#eab308", letterSpacing: 1, padding: "4px 10px", background: "rgba(234,179,8,0.1)", borderRadius: 8, display: "inline-block" }}>
                    {coupon.code}
                  </div>
                  {/* ডিসকাউন্ট অ্যামাউন্ট ডিসপ্লে */}
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
                    {coupon.discount_type === "percentage" ? `${Number(coupon.discount_value)}% OFF` : `৳${Number(coupon.discount_value)} OFF`}
                  </div>
                </div>
                {/* স্ট্যাটাস টগল বাটন */}
                <button onClick={() => handleToggle(coupon.code, coupon.is_active)} style={{
                  background: "none", border: "none", fontSize: 24, cursor: "pointer",
                  color: coupon.is_active ? "#4ade80" : "rgba(255,255,255,0.2)"
                }}>
                  {coupon.is_active ? "🟢" : "⚫"}
                </button>
              </div>

              {/* কুপনের শর্তাবলী (Terms and Conditions) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                <div>Min Spend: <strong style={{ color: "white" }}>৳{Number(coupon.min_spend)}</strong></div>
                {coupon.max_discount && <div>Max Discount: <strong style={{ color: "white" }}>৳{Number(coupon.max_discount)}</strong></div>}
                <div>Used: <strong style={{ color: "white" }}>{coupon.usage_count}</strong> {coupon.usage_limit ? `/ ${coupon.usage_limit}` : "times"}</div>
                {coupon.expiry_date && (
                  <div style={{ color: isExpired ? "#f87171" : "inherit" }}>
                    Expires: {new Date(coupon.expiry_date).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              {/* কন্ডিশনাল ব্যাজ (Conditional Badge): যদি মেয়াদ শেষ বা লিমিট ক্রস করে থাকে। */}
              {(isExpired || isExhausted) && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#f87171", padding: "4px 8px", background: "rgba(239,68,68,0.1)", borderRadius: 6, display: "inline-block" }}>
                  {isExpired ? "Expired" : "Usage limit reached"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ৪. ইনলাইন স্টাইলস (Inline Styles)
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", fontSize: 14, outline: "none" };

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/admin/coupons/AdminCouponsClient.tsx`) একটি ইন্টারঅ্যাক্টিভ ক্লায়েন্ট কম্পোনেন্ট (Interactive Client Component)। এটি ইউজারের সাথে ইন্টারঅ্যাক্ট করার জন্য রিঅ্যাক্ট হুকস (React Hooks) ব্যবহার করে। এটি ফর্মের মাধ্যমে নতুন কুপন তৈরি এবং বিদ্যমান কুপনের স্ট্যাটাস (Active/Inactive) রিয়েল-টাইমে (Real-time) পরিবর্তন করার সুবিধা প্রদান করে।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
যদিও এটি একটি ক্লায়েন্ট কম্পোনেন্ট, এর ভেতরের মূল বিজনেস লজিকগুলো (যেমন `createCouponAction`, `toggleCouponAction`) সার্ভার অ্যাকশন হিসেবে ইমপ্লিমেন্ট করা আছে, যা কিনা ব্যাকএন্ডে (Backend) সিকিউরড। অর্থাৎ ক্লায়েন্ট সাইড থেকে কেউ যদি ফর্ম টেম্পারিং (Form Tampering) বা ডাটা ম্যানিপুলেট (Data Manipulate) করার চেষ্টা করে, সার্ভার অ্যাকশন সেটা ভ্যালিডেট করে আটকে দেবে। 

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এখানে ডেটা সিঙ্ক্রোনাইজেশনের (Data Synchronization) একটি চমৎকার উদাহরণ দেখা যায়। সার্ভার কম্পোনেন্ট থেকে প্রাথমিক ডেটা (`initialCoupons`) রিসিভ করে তাকে লোকাল স্টেটে (`coupons`) সংরক্ষণ করা হয়। যখন অ্যাডমিন কোনো কুপনের স্ট্যাটাস টগল করেন, তখন প্রথমে সার্ভার অ্যাকশন কল হয় এবং সাকসেস হলে `setCoupons` এর মাধ্যমে ক্লায়েন্ট স্টেট ম্যানুয়ালি আপডেট করা হয়। এতে করে পেজ রিলোড ছাড়াই UI তাৎক্ষণিকভাবে রিঅ্যাক্ট করে, যা ইউজার এক্সপেরিয়েন্স (UX) বহুগুণে বৃদ্ধি করে।
================================================================================
*/
