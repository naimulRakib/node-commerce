// এসইও (SEO) এর জন্য মেটাডেটা ইন্টারফেস।
import { Metadata } from "next";
// ডেটাবেস ইনস্ট্যান্স, ক্যাটাগরি ফেচ করার জন্য।
import { db } from "@/lib/db";
// ক্লায়েন্ট-সাইড রাউটিং এর জন্য লিংক।
import Link from "next/link";
// প্রোডাক্ট তৈরি করার সার্ভার অ্যাকশন।
import { createProductAction } from "@/actions/admin";
// সফলভাবে প্রোডাক্ট তৈরির পর রিডাইরেক্ট করার ফাংশন।
import { redirect } from "next/navigation";

// ─── মেটাডেটা (Metadata) ──────────────────────────────────────────────────────────
export const metadata: Metadata = { title: "Add Product — Admin" };

// ─── সার্ভার কম্পোনেন্ট (Server Component) ──────────────────────────────
export default async function AdminNewProductPage() {
  // ১. ডেটা ফেচিং (Data Fetching): 
  // ড্রপডাউনে দেখানোর জন্য ডেটাবেস থেকে সব ক্যাটাগরি ফেচ করা হচ্ছে।
  const res = await db.query('SELECT * FROM category ORDER BY name ASC');
  const categories = res.rows;

  // ২. ইনলাইন সার্ভার অ্যাকশন (Inline Server Action):
  // এটি একটি সার্ভার-সাইড ফাংশন যা সরাসরি ফর্ম সাবমিশনে কল হবে।
  async function handleCreate(formData: FormData) {
    "use server"; // এই ডিরেক্টিভটি নিশ্চিত করে যে এই ফাংশনটি শুধুমাত্র সার্ভারে এক্সিকিউট হবে।
    
    // বাহ্যিক সার্ভার অ্যাকশনকে কল করা হচ্ছে।
    const result = await createProductAction(formData);
    
    // যদি সফলভাবে প্রোডাক্ট তৈরি হয় এবং ডাটাবেস থেকে ID ফেরত আসে, 
    // তবে সাথে সাথেই প্রোডাক্ট এডিট পেজে রিডাইরেক্ট করা হবে (যেখানে ভ্যারিয়েন্ট বা ছবি অ্যাড করা যাবে)।
    if (result.productId) redirect(`/admin/products/${result.productId}/edit`);
    
    // দ্রষ্টব্য (Note): বাস্তব প্রোডাকশন অ্যাপ্লিকেশনে এখানে ট্রাই-ক্যাচ (try-catch) বা 
    // 'useActionState' হুক ব্যবহার করে ক্লায়েন্ট-সাইডে প্রপার এরর হ্যান্ডলিং (Error Handling) করতে হয়।
    // এই একাডেমিক ডেমোতে কোড সিম্পল রাখার জন্য শুধুমাত্র সাকসেস রিডাইরেক্ট দেখানো হয়েছে।
  }

  // ৩. ইউজার ইন্টারফেস (User Interface - UI):
  return (
    <div style={{ maxWidth: 600 }}>
      {/* হেডার (Header) */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
        <Link href="/admin/products" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: 20 }}>←</Link>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 24, color: "white" }}>Add New Product</h1>
      </div>

      {/* প্রোডাক্ট তৈরির ফর্ম (Product Creation Form) */}
      <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 28 }}>
        <form action={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* প্রোডাক্টের নাম (Product Name) */}
          <div>
            <label style={labelStyle}>Product Name *</label>
            <input name="name" required style={inputStyle} placeholder="e.g. Wireless Headphones" />
          </div>
          
          {/* এসকেইউ (SKU) এবং প্রাইস (Price) - গ্রিড লেআউট */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Product Code (SKU Base) *</label>
              <input name="product_code" required style={inputStyle} placeholder="e.g. HDPH-001" />
            </div>
            <div>
              <label style={labelStyle}>Base Price (৳) *</label>
              <input name="base_price" type="number" min="0" required style={inputStyle} placeholder="0.00" />
            </div>
          </div>

          {/* ক্যাটাগরি সিলেকশন (Category Selection) */}
          <div>
            <label style={labelStyle}>Category</label>
            <select name="category_id" style={inputStyle}>
              <option value="">Select Category...</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* বর্ণনা (Description) */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea name="description" rows={4} style={{ ...inputStyle, resize: "vertical" }} placeholder="Product details..." />
          </div>

          {/* সাবমিট বাটন (Submit Button) */}
          <div style={{ marginTop: 8 }}>
            <button type="submit" style={{
              padding: "12px 24px", background: "linear-gradient(135deg, #eab308, #ca8a04)",
              border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>Create Product</button>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 12 }}>
              Note: You can add variants (colors, sizes) and inventory after creating the base product.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// ৪. ইনলাইন স্টাইলস (Inline Styles): 
// কোড রিপিটেশন কমানোর জন্য কমন স্টাইলগুলোকে অবজেক্ট আকারে ডিফাইন করা হয়েছে।
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, color: "white", fontSize: 14, outline: "none" };

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/admin/products/new/page.tsx`) সিস্টেমে একটি নতুন প্রোডাক্ট এন্ট্রি (Product Entry) তৈরি করার ইন্টারফেস প্রদান করে। এটি একটি পিওর সার্ভার কম্পোনেন্ট (Pure Server Component)। এখানে কোনো ক্লায়েন্ট-সাইড জাভাস্ক্রিপ্ট (Client-side JavaScript) স্টেট (State) ব্যবহার করা হয়নি। ফর্ম সাবমিশনটি নেক্সট.জেএস (Next.js) এর ইনলাইন সার্ভার অ্যাকশন (Inline Server Action) `handleCreate` এর মাধ্যমে হ্যান্ডেল করা হয়েছে। 

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
অ্যাডমিন লেআউটের চাইল্ড (Child) হওয়ায় এটি সুরক্ষিত। ফর্ম ডেটা প্রসেস করার জন্য এটি `createProductAction` কল করে, যেখানে মূল লজিক এবং সিকিউরিটি চেকগুলো (যেমন ইনজেকশন রোধ) ইমপ্লিমেন্ট করা আছে। যেহেতু এটি কোনো ক্লায়েন্ট কম্পোনেন্ট নয়, তাই ডেটা ম্যানিপুলেশন পুরোটাই সার্ভারের সিকিউরড এনভায়রনমেন্টে (Secured Environment) সংঘটিত হয়।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এখানে টু-স্টেপ প্রোডাক্ট ক্রিয়েশন ফ্লো (Two-step Product Creation Flow) ব্যবহার করা হয়েছে। প্রথম ধাপে শুধুমাত্র প্রোডাক্টের বেস ইনফরমেশন (Base Information) যেমন নাম, এসকেইউ (SKU), প্রাইস ইনপুট নেওয়া হয়। ডাটাবেসে বেস প্রোডাক্টটি সফলভাবে ইনসার্ট (Insert) হওয়ার পর ডাটাবেস একটি ইউনিক `product_id` জেনারেট করে। সার্ভার অ্যাকশন সেই আইডিটি রিটার্ন করে এবং `redirect` ফাংশনের মাধ্যমে সিস্টেম অ্যাডমিনকে দ্বিতীয় ধাপে (Edit Page) নিয়ে যায়। এডিট পেজে গিয়ে অ্যাডমিন তখন স্পেসিফিক প্রোডাক্ট ভ্যারিয়েন্ট (রঙ, সাইজ) এবং স্টক অ্যাড করতে পারবেন। এটি কমপ্লেক্স ফর্ম ম্যানেজমেন্টকে (Complex Form Management) সিম্পলিফাই করার একটি চমৎকার আর্কিটেকচারাল প্যাটার্ন।
================================================================================
*/
