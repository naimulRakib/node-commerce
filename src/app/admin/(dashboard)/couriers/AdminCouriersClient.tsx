// এটি একটি ক্লায়েন্ট কম্পোনেন্ট, ব্রাউজারে এক্সিকিউট হবে।
"use client";

// লোকাল স্টেট ম্যানেজমেন্টের জন্য রিঅ্যাক্ট হুক।
import { useState } from "react";
// সার্ভার অ্যাকশনস, যা কুরিয়ার তৈরি এবং স্ট্যাটাস টগল করতে ব্যবহৃত হবে।
import { createCourierAction, toggleCourierAction } from "@/actions/admin";

// কুরিয়ার টাইপ ডেফিনিশন (Type Definition)।
type Courier = {
  courier_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  _count: { orders: number }; // রিলেশনাল কাউন্ট ডেটা।
};

// ─── ক্লায়েন্ট কম্পোনেন্ট (Client Component) ──────────────────────────────
export default function AdminCouriersClient({ initialCouriers }: { initialCouriers: Courier[] }) {
  // ১. স্টেট ম্যানেজমেন্ট (State Management)
  const [couriers, setCouriers] = useState(initialCouriers); // কুরিয়ারের তালিকা
  const [showForm, setShowForm] = useState(false); // ফর্মের ভিজিবিলিটি টগল
  const [error, setError] = useState(""); // ফর্ম সাবমিশনের এরর স্টেট
  const [loading, setLoading] = useState(false); // লোডিং ইন্ডিকেটর স্টেট

  // ২. ইভেন্ট হ্যান্ডলার্স (Event Handlers)
  
  // নতুন কুরিয়ার যোগ করার হ্যান্ডলার।
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // ডিফল্ট ফর্ম সাবমিশন প্রিভেন্ট করা।
    setLoading(true);
    setError("");
    
    // ফর্ম ডেটা এক্সট্র্যাকশন।
    const fd = new FormData(e.currentTarget);
    
    // সার্ভার অ্যাকশন এক্সিকিউশন।
    const result = await createCourierAction(fd);
    
    // এরর হ্যান্ডলিং ও সাকসেস ফ্লো।
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.reload(); // পেজ রিলোড করে ফ্রেশ ডেটা ফেচ করা।
    }
  }

  // কুরিয়ারের অ্যাক্টিভ/ইনঅ্যাক্টিভ স্ট্যাটাস পরিবর্তন করার হ্যান্ডলার।
  async function handleToggle(id: number, current: boolean) {
    // ব্যাকএন্ডে (Backend) স্ট্যাটাস আপডেট রিকোয়েস্ট পাঠানো।
    await toggleCourierAction(id, !current);
    
    // ক্লায়েন্ট-সাইড স্টেট লোকালি আপডেট করা (Optimistic-like update)।
    setCouriers(prev => prev.map(c => c.courier_id === id ? { ...c, is_active: !current } : c));
  }

  // ৩. ইউজার ইন্টারফেস (User Interface - UI)
  return (
    <div>
      {/* হেডার (Header) ও ফর্ম টগল বাটন */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white" }}>
          Couriers
        </h1>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: "11px 22px", background: showForm ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #eab308, #ca8a04)",
          border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>
          {showForm ? "Cancel" : "+ Add Courier"}
        </button>
      </div>

      {/* কুরিয়ার যোগ করার ফর্ম (Courier Registration Form) */}
      {showForm && (
        <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 16 }}>Register New Courier</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* এরর মেসেজ */}
            {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* কুরিয়ারের নাম */}
              <div>
                <label style={labelStyle}>Courier Name *</label>
                <input name="name" required placeholder="e.g. Fast Delivery Co." style={inputStyle} />
              </div>
              {/* ফোন নম্বর */}
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input name="phone" placeholder="Contact number" style={inputStyle} />
              </div>
              {/* ইমেইল ঠিকানা */}
              <div>
                <label style={labelStyle}>Email Address</label>
                <input name="email" type="email" placeholder="contact@courier.com" style={inputStyle} />
              </div>
            </div>

            {/* সাবমিট বাটন */}
            <button type="submit" disabled={loading} style={{
              alignSelf: "flex-start", padding: "12px 24px", background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.3)", borderRadius: 12, color: "#eab308", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
              {loading ? "Creating..." : "Save Courier"}
            </button>
          </form>
        </div>
      )}

      {/* কুরিয়ার লিস্ট (Courier List) - গ্রিড লেআউট */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {couriers.map((courier) => (
          // কুরিয়ার কার্ড (Courier Card)
          <div key={courier.courier_id} style={{
            background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: 20, opacity: courier.is_active ? 1 : 0.6, // ইনঅ্যাক্টিভ হলে অপাসিটি কমানো হয়।
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                {/* নাম */}
                <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 4 }}>
                  {courier.name}
                </div>
                {/* যোগাযোগের তথ্য */}
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  {courier.phone || "No phone"} • {courier.email || "No email"}
                </div>
              </div>
              {/* স্ট্যাটাস টগল বাটন */}
              <button onClick={() => handleToggle(courier.courier_id, courier.is_active)} style={{
                background: "none", border: "none", fontSize: 24, cursor: "pointer",
                color: courier.is_active ? "#4ade80" : "rgba(255,255,255,0.2)"
              }}>
                {courier.is_active ? "🟢" : "⚫"}
              </button>
            </div>

            {/* পারফরম্যান্স মেট্রিক্স (Performance Metrics): মোট অর্ডার সংখ্যা */}
            <div style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Total Orders Handled</span>
              <span style={{ color: "white", fontWeight: 600 }}>{courier._count.orders}</span>
            </div>
          </div>
        ))}
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
এই ফাইলটি (`src/app/admin/couriers/AdminCouriersClient.tsx`) একটি রিঅ্যাক্ট ক্লায়েন্ট কম্পোনেন্ট (React Client Component), যা কুরিয়ার ম্যানেজমেন্টের ইউজার ইন্টারফেস (UI) প্রদান করে। এটি নতুন কুরিয়ার যোগ করার জন্য একটি ফর্ম (Form) এবং বিদ্যমান কুরিয়ারগুলোর তালিকা প্রদর্শন করে। ফর্মের স্টেট ম্যানেজমেন্ট এবং সার্ভারের সাথে ইন্টিগ্রেশনের জন্য `useState` হুক এবং সার্ভার অ্যাকশন ব্যবহৃত হয়েছে।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
ডেটাবেস ম্যানিপুলেশন (ডেটা ইনসার্ট বা আপডেট) সম্পূর্ণভাবে নেক্সট.জেএস-এর সিকিউরড সার্ভার অ্যাকশন (`createCourierAction`, `toggleCourierAction`) এর মাধ্যমে সম্পন্ন হয়। ফলে ক্লায়েন্ট সাইডে কোনো র (Raw) API কল বা ডেটাবেস ক্রেডেনশিয়াল এক্সপোজ হয় না, যা সিকিউরিটির (Security) জন্য সর্বোত্তম অনুশীলন (Best Practice)।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
সার্ভার সাইড রেন্ডারিংয়ের (SSR) মাধ্যমে প্রাপ্ত `initialCouriers` প্রপস দিয়ে কম্পোনেন্টের প্রাথমিক স্টেট তৈরি হয়। ইউজার যখন কোনো কুরিয়ারের স্ট্যাটাস পরিবর্তন করেন, তখন সার্ভার অ্যাকশনটি অ্যাসিঙ্ক্রোনাসলি (Asynchronously) এক্সিকিউট হয় এবং সফল হলে লোকাল স্টেট `setCouriers` এর মাধ্যমে আপডেট করা হয়, যা অপটিমিস্টিক ইউআই (Optimistic UI) প্যাটার্নের কাছাকাছি একটি পদ্ধতি। এটি ব্যবহারকারীকে একটি স্মুথ (Smooth) এবং দ্রুত রেসপন্সিভ অভিজ্ঞতা প্রদান করে।
================================================================================
*/
