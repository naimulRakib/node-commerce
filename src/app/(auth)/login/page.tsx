// এটি একটি ক্লায়েন্ট কম্পোনেন্ট, তাই এটি ব্রাউজারে এক্সিকিউট (Execute) হবে।
"use client";

// রিঅ্যাক্ট (React) থেকে 'useState' হুক ইমপোর্ট করা হচ্ছে, যা কম্পোনেন্টের লোকাল স্টেট ম্যানেজ করতে ব্যবহৃত হয়।
import { useState } from "react";
// ক্লায়েন্ট-সাইড রাউটিং এর জন্য নেক্সট.জেএস (Next.js) এর 'Link' কম্পোনেন্ট।
import Link from "next/link";
// প্রমাণীকরণ (Authentication) সম্পন্ন করার জন্য সার্ভার অ্যাকশন।
import { loginAction } from "@/actions/auth";

// লগ-ইন পেজ কম্পোনেন্ট
export default function LoginPage() {
  // ১. স্টেট ম্যানেজমেন্ট (State Management):
  // ইউজারকে কোনো ত্রুটি বা এরর দেখানোর জন্য স্টেট।
  const [error, setError] = useState("");
  // সাবমিশনের সময় লোডিং ইন্ডিকেটর দেখানোর জন্য স্টেট।
  const [loading, setLoading] = useState(false);

  // ২. ইভেন্ট হ্যান্ডলার (Event Handler):
  // ফর্ম সাবমিট করার সময় এই ফাংশনটি কল হয়।
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // ফর্মের ডিফল্ট সাবমিশন (যাতে পেজ রিলোড না হয়) বন্ধ করা।
    e.preventDefault();
    setLoading(true); // লোডিং স্টেট অন করা
    setError(""); // আগের কোনো এরর থাকলে তা মুছে ফেলা

    // ফর্ম থেকে ডেটা সংগ্রহ করা (FormData API ব্যবহার করে)।
    const formData = new FormData(e.currentTarget);
    // সার্ভার অ্যাকশন কল করে ব্যাকএন্ডে ডেটা পাঠানো।
    const result = await loginAction(formData);
    
    // যদি ব্যাকএন্ড থেকে কোনো এরর আসে (যেমন: ইনভ্যালিড পাসওয়ার্ড), তবে সেটি স্টেটে সেভ করা।
    if (result?.error) {
      setError(result.error);
      setLoading(false); // লোডিং স্টেট অফ করা
    }
    // সফল হলে সার্ভার অ্যাকশন নিজেই ইউজারকে রিডাইরেক্ট (Redirect) করে দেবে, তাই আলাদা করে হ্যান্ডেল করার প্রয়োজন নেই।
  }

  // ৩. ইউজার ইন্টারফেস (User Interface):
  return (
    <div style={{
      width: "100%", maxWidth: 440,
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
      }}>Welcome Back</h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center", marginBottom: 32 }}>
        Sign in to your NodeCommerce account
      </p>

      {/* এরর মেসেজ ডিসপ্লে (Error Message Display) */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 20,
          color: "#f87171", fontSize: 14,
        }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> {error}</div>
      )}

      {/* লগ-ইন ফর্ম (Login Form) */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            name="email"
            required // এইচটিএমএল৫ (HTML5) ফর্ম ভ্যালিডেশন
            placeholder="your@email.com"
            style={inputStyle} // নিচে ডিফাইন করা কমন স্টাইল অবজেক্ট
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
            Password
          </label>
          <input
            id="login-password"
            type="password"
            name="password"
            required
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        {/* সাবমিট বাটন (Submit Button) */}
        <button
          id="login-submit-btn"
          type="submit"
          disabled={loading} // ডেটা সাবমিট হওয়ার সময় বাটন ডিজেবল রাখা
          style={{
            marginTop: 8, padding: "14px",
            background: loading ? "rgba(234,179,8,0.5)" : "linear-gradient(135deg, #eab308, #ca8a04)",
            border: "none", borderRadius: 12, color: "white",
            fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
          }}
        >
          {loading ? "Signing in..." : "Sign In →"}
        </button>
      </form>

      {/* রেজিস্ট্রেশন পেজে যাওয়ার লিংক (Link to Registration Page) */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#eab308", textDecoration: "none", fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>

      {/* ডেমো ক্রেডেনশিয়ালস (Demo credentials for testing) */}
      <div style={{
        marginTop: 24, padding: "14px 16px",
        background: "rgba(234,179,8,0.05)",
        border: "1px solid rgba(234,179,8,0.15)",
        borderRadius: 12,
      }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></svg> Demo credentials:</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Email: <strong>test@example.com</strong></p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Password: <strong>customer123</strong></p>
      </div>
    </div>
  );
}

// ইনপুটের জন্য সাধারণ স্টাইল অবজেক্ট (Common Style Object for Inputs)
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 12, color: "white", fontSize: 15, outline: "none",
  transition: "border-color 0.2s ease",
};

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/(auth)/login/page.tsx`) একটি ইউজার-ফেসিং (User-facing) লগ-ইন ইন্টারফেস রেন্ডার করে। এটি একটি রিঅ্যাক্ট ক্লায়েন্ট কম্পোনেন্ট যেখানে একটি ফর্মের মাধ্যমে ইউজারের ইমেইল এবং পাসওয়ার্ড সংগ্রহ করা হয়। ফর্মটি সাবমিট করার সময় `FormData` API ব্যবহার করে ডেটা এক্সট্রাক্ট করা হয় এবং তা প্রসেস করার জন্য `loginAction` নামক একটি সিকিউর সার্ভার অ্যাকশনে পাঠানো হয়।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
লগ-ইনের পুরো কোর লজিকটি ক্লায়েন্ট সাইড থেকে আলাদা রাখা হয়েছে। ব্রাউজারে কোনো API কল করার বদলে নেক্সট.জেএস-এর "সার্ভার অ্যাকশন" (Server Action) ব্যবহার করা হয়েছে। ইউজার যখন সাবমিট বাটনে ক্লিক করে, তখন `loginAction` সরাসরি সার্ভারে রান করে, ডাটাবেসের সাথে পাসওয়ার্ড হ্যাশ (Password Hash - bcrypt) মিলিয়ে দেখে এবং সফল হলে ইউজারের ব্রাউজারে একটি "HTTP-only Secure Cookie" সেট করে দেয়। এই প্রক্রিয়ায় ক্লায়েন্ট-সাইডে কোনো সেনসিটিভ ডেটা বা টোকেন এক্সপোজ হয় না, যা এক্সএসএস (XSS - Cross-Site Scripting) অ্যাটাক প্রতিরোধে অত্যন্ত কার্যকরী।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই কম্পোনেন্টটি ডেটা মিউটেশনের (Data Mutation) জন্য রিঅ্যাক্ট-এর ফর্ম ইভেন্ট ড্রিভেন (Form Event Driven) প্যাটার্ন ব্যবহার করেছে। ফর্ম সাবমিশনের পর `setLoading(true)` এর মাধ্যমে অপ্টিমিস্টিক ইউআই (Optimistic UI) টেকনিক অ্যাপ্লাই করা হয়েছে। সার্ভার অ্যাকশন যদি কোনো এক্সেপশন বা এরর থ্রো করে (যেমন: Wrong password), তখন অ্যাকশনটি একটি `error` অবজেক্ট রিটার্ন করে যা ক্লায়েন্ট স্টেটে (`setError(result.error)`) স্টোর হয় এবং ইউজারকে দেখানো হয়।
================================================================================
*/
