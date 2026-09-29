// এসইও (SEO) এর জন্য মেটাডেটা ইন্টারফেস।
import { Metadata } from "next";
// যদি ডাটাবেসে প্রোডাক্ট না পাওয়া যায়, তবে 404 পেজে রিডাইরেক্ট (Redirect) করার জন্য।
import { notFound } from "next/navigation";
// ক্লায়েন্ট-সাইড রাউটিং এর জন্য লিংক।
import Link from "next/link";
// ডাটাবেস এক্সেস করার জন্য ইনস্ট্যান্স।
import { db } from "@/lib/db";
// প্রোডাক্ট আপডেট করার সার্ভার অ্যাকশন।
import { updateProductAction } from "@/actions/admin";

// ─── মেটাডেটা (Metadata) ──────────────────────────────────────────────────────────
export const metadata: Metadata = { title: "Edit Product — Admin" };

// ডায়নামিক রাউট প্যারামিটার টাইপিং (Dynamic Route Parameter Typing)।
type Props = { params: Promise<{ id: string }> };

// ─── সার্ভার কম্পোনেন্ট (Server Component) ──────────────────────────────
export default async function AdminEditProductPage({ params }: Props) {
  // ১. প্যারামিটার এক্সট্র্যাকশন (Parameter Extraction):
  // URL থেকে ডায়নামিক 'id' এক্সট্র্যাক্ট করা হচ্ছে।
  const { id } = await params;
  
  // ২. ডেটা ফেচিং (Data Fetching / Scatter-Gather Pattern):
  // প্রোডাক্টের মূল ডেটা, ক্যাটাগরি লিস্ট এবং প্রোডাক্টের ভ্যারিয়েন্ট প্যারালালি ফেচ করা হচ্ছে 
  // যাতে লেটেন্সি (Latency) কমানো যায়।
  const [productRes, categoriesRes, variantsRes] = await Promise.all([
    db.query('SELECT * FROM product WHERE product_id = $1', [Number(id)]),
    db.query('SELECT * FROM category ORDER BY name ASC'),
    db.query('SELECT * FROM product_variant WHERE product_id = $1', [Number(id)])
  ]);
  
  // যদি প্রোডাক্ট না পাওয়া যায়, 404 (Not Found) রেন্ডার করা হবে।
  if (productRes.rows.length === 0) notFound();
  
  // ৩. ডেটা অ্যাগ্রিগেশন (Data Aggregation):
  // ভ্যারিয়েন্টগুলোকে মূল প্রোডাক্ট অবজেক্টের সাথে যুক্ত করা হচ্ছে।
  const product = {
    ...productRes.rows[0],
    variants: variantsRes.rows
  };
  const categories = categoriesRes.rows;

  // ৪. ইনলাইন সার্ভার অ্যাকশন (Inline Server Action):
  // ফর্ম সাবমিট হলে এই ফাংশনটি কল হবে এবং ডেটা আপডেট করবে।
  async function handleUpdate(formData: FormData) {
    "use server"; // সার্ভার এনভায়রনমেন্ট নিশ্চিত করার ডিরেক্টিভ।
    
    // বাহ্যিক অ্যাকশন কল করা হচ্ছে এবং প্রোডাক্ট আইডি (id) আর্গুমেন্ট হিসেবে পাস করা হচ্ছে।
    await updateProductAction(Number(id), formData);
  }

  // ৫. ইউজার ইন্টারফেস (User Interface - UI):
  return (
    <div>
      {/* হেডার সেকশন (Header Section) */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
        <Link href="/admin/products" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: 20 }}>←</Link>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 24, color: "white" }}>
          Edit Product: <span style={{ color: "#eab308" }}>{product.name}</span>
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        
        {/* বাম কলাম: মূল বিবরণ (Main Details) সম্পাদনা করার ফর্ম */}
        <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 20 }}>Basic Information</h2>
          <form action={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* প্রোডাক্টের নাম সম্পাদনা */}
            <div>
              <label style={labelStyle}>Product Name</label>
              <input name="name" defaultValue={product.name} required style={inputStyle} />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* প্রোডাক্ট কোড বা এসকেইউ (Read-only) - এটি পরিবর্তনযোগ্য নয় */}
              <div>
                <label style={labelStyle}>Product Code (Read-only)</label>
                <input value={product.product_code} readOnly style={{ ...inputStyle, background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.4)" }} />
              </div>
              {/* বেস প্রাইস সম্পাদনা */}
              <div>
                <label style={labelStyle}>Base Price (৳)</label>
                <input name="base_price" type="number" min="0" defaultValue={Number(product.base_price)} required style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* ক্যাটাগরি সম্পাদনা */}
              <div>
                <label style={labelStyle}>Category</label>
                <select name="category_id" defaultValue={product.category_id ?? ""} style={inputStyle}>
                  <option value="">None</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {/* স্ট্যাটাস টগল (অ্যাক্টিভ/ইনঅ্যাক্টিভ) */}
              <div>
                <label style={labelStyle}>Status</label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, cursor: "pointer" }}>
                  <input type="checkbox" name="is_active" defaultChecked={product.is_active} style={{ accentColor: "#eab308" }} />
                  <span style={{ color: "white", fontSize: 14 }}>Active in store</span>
                </label>
              </div>
            </div>

            {/* বর্ণনা (Description) সম্পাদনা */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea name="description" defaultValue={product.description ?? ""} rows={5} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            {/* সাবমিট বাটন */}
            <div style={{ marginTop: 8 }}>
              <button type="submit" style={{
                padding: "12px 24px", background: "linear-gradient(135deg, #eab308, #ca8a04)",
                border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}>Save Changes</button>
            </div>
          </form>
        </div>

        {/* ডান কলাম: ভ্যারিয়েন্ট ও ইনভেন্টরি (Variants & Inventory) - ডেমো পারপাস রিড-অনলি */}
        <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24, height: "fit-content" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 16 }}>Variants & Inventory</h2>
          
          {product.variants.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No variants added yet. Stock is managed at product level.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {product.variants.map((v: any) => (
                <div key={v.variant_code} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{v.color} {v.size ? `/ ${v.size}` : ""}</span>
                    {/* স্টক কম হলে কালার কোড পরিবর্তন (Threshold = 5) */}
                    <span style={{ color: v.quantity <= 5 ? "#f87171" : "#4ade80", fontSize: 13, fontWeight: 600 }}>{v.quantity} in stock</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "monospace" }}>{v.sku}</div>
                </div>
              ))}
            </div>
          )}
          {/* একাডেমিক ডেমোর জন্য ডিসক্লেইমার */}
          <div style={{ marginTop: 16, padding: 12, background: "rgba(59,130,246,0.1)", borderRadius: 10, color: "#60a5fa", fontSize: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> Managing variants and deep inventory is outside the scope of this view. Use database seed or dedicated inventory tools.
          </div>
        </div>
      </div>
    </div>
  );
}

// ৬. কমন স্টাইলস (Common Styles)
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, color: "white", fontSize: 14, outline: "none" };

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/admin/products/[id]/edit/page.tsx`) সিস্টেমে একটি বিদ্যমান (Existing) প্রোডাক্টের তথ্য সংশোধন করার জন্য ব্যবহৃত হয়। এটি ডাটাবেস থেকে ডায়নামিক `id` ব্যবহার করে নির্দিষ্ট প্রোডাক্টের ডেটা ফেচ করে এবং তা `defaultValue` হিসেবে ফর্মের ইনপুট ফিল্ডগুলোতে সেট করে দেয় (Uncontrolled Components)। ফর্ম সাবমিট হলে নেক্সট.জেএস (Next.js) এর সার্ভার অ্যাকশন কল হয়। 

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এটি একটি গ্লোবাল অ্যাডমিন লেআউটের আন্ডারে থাকায় সিকিউরড (Secured)। ডায়নামিক `id` কে প্যারামিটারাইজড কুয়েরিতে ইনজেক্ট করার সময় `Number(id)` দিয়ে টাইপকাস্টিং (Typecasting) করা হয়েছে, যা এসকিউএল ইনজেকশনের (SQL Injection) সম্ভাবনা নস্যাৎ করে দেয়। 

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এখানে সার্ভার-সাইড রেন্ডারিং (SSR) এর মাধ্যমে প্রাথমিক ডেটা পেলোড (Initial Payload) তৈরি করা হয়, ফলে এসইও (SEO) এবং পেজ লোড পারফরম্যান্স ভালো হয়। ফর্ম সাবমিট হলে ইনলাইন সার্ভার অ্যাকশন (`handleUpdate`) ট্রিগার হয়, যা `updateProductAction` কে প্রোডাক্টের আইডি সহ কল করে। এটি ক্লায়েন্ট-সাইড জাভাস্ক্রিপ্টের উপর নির্ভরতা কমায় এবং ডেটা ফ্লো কে ডাইরেক্ট ও সিম্পল রাখে। প্রোডাক্ট কোড ফিল্ডটি `readOnly` রাখা হয়েছে, কারণ এসকেইউ (SKU) সাধারণত একবার তৈরি হলে তা পরিবর্তন করা বিজনেস লজিকের (Business Logic) পরিপন্থী।
================================================================================
*/
