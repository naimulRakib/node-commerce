// এটি একটি ক্লায়েন্ট কম্পোনেন্ট, তাই এটি ব্রাউজারে এক্সিকিউট (Execute) হবে।
"use client";

// রিঅ্যাক্ট (React) থেকে 'useState' হুক ইমপোর্ট করা হচ্ছে, যা কম্পোনেন্টের লোকাল স্টেট ম্যানেজ করতে ব্যবহৃত হয়।
import { useState } from "react";
// ক্লায়েন্ট-সাইড রাউটিং এর জন্য নেক্সট.জেএস (Next.js) এর 'Link' কম্পোনেন্ট।
import Link from "next/link";
// নতুন অ্যাকাউন্ট তৈরি (Registration) সম্পন্ন করার জন্য সার্ভার অ্যাকশন।
import { registerAction } from "@/actions/auth";

// রেজিস্ট্রেশন পেজ কম্পোনেন্ট
export default function RegisterPage() {
  // ১. স্টেট ম্যানেজমেন্ট (State Management):
  // ইউজারকে কোনো ত্রুটি বা এরর দেখানোর জন্য স্টেট।
  const [error, setError] = useState("");
  // সাবমিশনের সময় লোডিং ইন্ডিকেটর দেখানোর জন্য স্টেট।
  const [loading, setLoading] = useState(false);

  // ২. ইভেন্ট হ্যান্ডলার (Event Handler):
  // ফর্ম সাবমিট করার সময় এই ফাংশনটি কল হয়।
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // ফর্মের ডিফল্ট সাবমিশন বন্ধ করা যাতে পেজ রিলোড না হয়।
    e.preventDefault();
    setLoading(true); // লোডিং স্টেট অন করা
    setError(""); // আগের কোনো এরর থাকলে তা মুছে ফেলা

    // ফর্ম থেকে ডেটা সংগ্রহ করা (FormData API ব্যবহার করে)।
    const formData = new FormData(e.currentTarget);
    // সার্ভার অ্যাকশন কল করে ব্যাকএন্ডে ডেটা পাঠানো।
    const result = await registerAction(formData);
    
    // যদি ব্যাকএন্ড থেকে কোনো এরর আসে (যেমন: ইমেইল ইতিমধ্যে ব্যবহৃত, বা পাসওয়ার্ড ম্যাচ করেনি), তবে সেটি স্টেটে সেভ করা।
    if (result?.error) {
      setError(result.error);
      setLoading(false); // লোডিং স্টেট অফ করা
    }
    // সফল হলে সার্ভার অ্যাকশন নিজেই ইউজারকে রিডাইরেক্ট করে দেবে।
  }

  // ৩. ইউজার ইন্টারফেস (User Interface):
  return (
    <div style={{
      width: "100%", maxWidth: 480,
      background: "rgba(22,22,31,0.9)", // গ্লাস ইমফেক্ট (Glassmorphism) এর জন্য আধা-স্বচ্ছ ব্যাকগ্রাউন্ড
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 24, padding: "40px 36px",
      boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      backdropFilter: "blur(20px)", // পেছনের অবজেক্টগুলোকে ব্লার (Blur) করা
    }}>
      {/* হেডলাইন (Headline) */}
      <h1 style={{
        fontFamily: "Outfit, sans-serif", fontWeight: 800,
        fontSize: 28, color: "white", marginBottom: 8, textAlign: "center",
      }}>Create Account</h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center", marginBottom: 32 }}>
        Join NodeCommerce and start shopping
      </p>

      {/* এরর মেসেজ ডিসপ্লে (Error Message Display) */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 20,
          color: "#f87171", fontSize: 14,
        }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> {error}</div>
      )}

      {/* রেজিস্ট্রেশন ফর্ম (Registration Form) */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input id="reg-name" type="text" name="name" required placeholder="Rahim Uddin" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Email Address *</label>
          <input id="reg-email" type="email" name="email" required placeholder="your@email.com" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Phone Number</label>
          <input id="reg-phone" type="tel" name="phone" placeholder="01XXXXXXXXX" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Password *</label>
          <input id="reg-password" type="password" name="password" required placeholder="Min. 6 characters" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Confirm Password *</label>
          <input id="reg-confirm" type="password" name="confirm" required placeholder="Repeat password" style={inputStyle} />
        </div>

        {/* সাবমিট বাটন (Submit Button) */}
        <button
          id="register-submit-btn"
          type="submit"
          disabled={loading} // ডেটা সাবমিট হওয়ার সময় বাটন ডিজেবল রাখা
          style={{
            marginTop: 8, padding: "14px",
            background: loading ? "rgba(234,179,8,0.5)" : "linear-gradient(135deg, #eab308, #ca8a04)",
            border: "none", borderRadius: 12, color: "white",
            fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating account..." : "Create Account →"}
        </button>
      </form>

      {/* লগ-ইন পেজে যাওয়ার লিংক (Link to Login Page) */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#eab308", textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// কমন স্টাইল অবজেক্টগুলো (Common Style Objects)
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 500,
  color: "rgba(255,255,255,0.6)", marginBottom: 8,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 12, color: "white", fontSize: 15, outline: "none",
};

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/(auth)/register/page.tsx`) সিস্টেমে নতুন ইউজার অনবোর্ডিং (User Onboarding) এর জন্য একটি রেজিস্ট্রেশন ইন্টারফেস তৈরি করে। এটি একটি রিঅ্যাক্ট ক্লায়েন্ট কম্পোনেন্ট যেখানে ইউজারের নাম, ইমেইল, ফোন নাম্বার এবং পাসওয়ার্ড সংগ্রহ করা হয়। ফর্ম সাবমিশনের পর `registerAction` নামক সিকিউর সার্ভার অ্যাকশন কল করা হয় যা ব্যাকএন্ডে ডেটা ভ্যালিডেশন এবং ইনসার্ট (Insert) এর কাজ করে।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এখানে লগ-ইনের মতই নেক্সট.জেএস এর সার্ভার অ্যাকশন (Server Action) আর্কিটেকচার ব্যবহার করা হয়েছে। ব্রাউজার থেকে সরাসরি ডাটাবেসে কানেক্ট করার কোনো উপায় রাখা হয়নি। ফর্ম ডেটা সার্ভারে যাওয়ার পর সেখানে পাসওয়ার্ড কনফারমেশন ম্যাচিং, ইমেইল ডুপ্লিকেশন চেক এবং পাসওয়ার্ড হ্যাশিং (Hashing) করা হয়। যদি কোনো সিকিউরিটি রুল বা ভ্যালিডেশন ফেইল করে, তবে সার্ভার অ্যাকশন একটি নির্দিষ্ট `error` মেসেজ রিটার্ন করে যা ক্লায়েন্টে ডিসপ্লে করা হয়। এই মেকানিজমটি ডেটা ইন্টেগ্রিটি (Data Integrity) নিশ্চিত করে।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই কম্পোনেন্টটি `FormData` API ব্যবহার করে ফর্ম থেকে ডায়নামিকালি সব ফিল্ডের ডেটা এক্সট্রাক্ট করে এবং সিঙ্গেল পেলোড (Single Payload) হিসেবে সার্ভার অ্যাকশনে পাঠায়। সার্ভার অ্যাকশন থেকে রেসপন্স আসার পর ডেরাইভড স্টেটের (Derived State) মাধ্যমে ইউআই अपडेट (UI Update) করা হয়। ইউজার এক্সপেরিয়েন্স উন্নত করার জন্য এখানেও সাবমিশনের সময় `disabled` বাটন এবং লোডিং টেক্সট দিয়ে অপ্টিমিস্টিক ইউআই (Optimistic UI) বাস্তবায়ন করা হয়েছে।
================================================================================
*/
