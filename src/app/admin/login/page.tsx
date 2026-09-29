// "use client" নির্দেশিকা (Directive) ব্যবহার করে নেক্সট.জেএস (Next.js) কে জানানো হচ্ছে যে 
// এই কম্পোনেন্টটি ক্লায়েন্ট-সাইডে রেন্ডার হবে, ফলে এতে রিঅ্যাক্ট হুকস (React Hooks) ব্যবহার করা যাবে।
"use client";

// লোকাল স্টেট (Local State) ম্যানেজ করার জন্য 'useState' হুক।
import { useState } from "react";
// সার্ভার-সাইড লগইন লজিক ইনভোক করার জন্য সার্ভার অ্যাকশন।
import { adminLoginAction } from "@/actions/admin";

// ─── অ্যাডমিন লগইন পেজ (Admin Login Page) ──────────────────────────────────────
export default function AdminLoginPage() {
  // ১. স্টেট ম্যানেজমেন্ট (State Management)
  const [error, setError] = useState(""); // সার্ভার থেকে আসা কোনো এরর মেসেজ (Error Message) স্টোর করার জন্য।
  const [loading, setLoading] = useState(false); // ফর্ম সাবমিট হওয়ার সময় লোডিং স্টেট (Loading State) ট্র্যাক করার জন্য।

  // ২. ইভেন্ট হ্যান্ডলার (Event Handler): ফর্ম সাবমিশনের লজিক।
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // ব্রাউজারের ডিফল্ট ফর্ম সাবমিশন (Page Reload) প্রিভেন্ট করা হচ্ছে।
    setLoading(true);   // প্রসেসিং শুরু, তাই লোডিং ট্রু করা হলো।
    setError("");       // পূর্বের কোনো এরর থাকলে তা রিসেট করা হলো।

    // HTML Form Element থেকে 'FormData' অবজেক্ট তৈরি করা হচ্ছে, 
    // যা ইনপুট ফিল্ডগুলোর ভ্যালু (email, password) ধারণ করবে।
    const fd = new FormData(e.currentTarget);
    
    // সার্ভার অ্যাকশন (Server Action) কল করা হচ্ছে। 
    // এটি ব্যাকএন্ডে '/actions/admin.ts' এর 'adminLoginAction' ফাংশনটি রান করবে।
    const result = await adminLoginAction(fd);
    
    // যদি সার্ভার থেকে কোনো এরর ফেরত আসে, তবে তা স্টেটে সেট করা হবে এবং লোডিং ফলস করা হবে।
    // সফল হলে সার্ভার থেকেই রিডাইরেক্ট (Redirect) হয়ে যাবে, তাই সফলতার কোনো স্টেট এখানে হ্যান্ডেল করার প্রয়োজন নেই।
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  // ৩. ইউজার ইন্টারফেস (User Interface - UI)
  return (
    // মূল কনটেইনার: ফুল স্ক্রিন এবং সেন্টার্ড (Centered) লেআউট।
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      {/* লগইন কার্ড (Login Card) */}
      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(13,13,20,0.95)", border: "1px solid rgba(168,85,247,0.2)",
        borderRadius: 24, padding: "40px 36px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
      }}>
        {/* লোগো এবং ব্র্যান্ডিং (Logo and Branding) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, background: "linear-gradient(135deg, #eab308, #ca8a04)",
            borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900, color: "white",
          }}>N</div>
          <div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 20, color: "white" }}>
              Node<span style={{ color: "#eab308" }}>Commerce</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Admin Panel</div>
          </div>
        </div>

        <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 26, color: "white", marginBottom: 6 }}>
          Admin Sign In
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 28 }}>
          Restricted access. Administrators only.
        </p>

        {/* এরর মেসেজ ডিসপ্লে (Error Message Display) */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#f87171", fontSize: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> {error}
          </div>
        )}

        {/* লগইন ফর্ম (Login Form) */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* ইমেইল ইনপুট */}
          <div>
            <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Admin Email</label>
            <input id="admin-email" name="email" type="email" required placeholder="admin@nodecommerce.com"
              style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, color: "white", fontSize: 15, outline: "none" }} />
          </div>
          
          {/* পাসওয়ার্ড ইনপুট */}
          <div>
            <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Password</label>
            <input id="admin-password" name="password" type="password" required placeholder="••••••••"
              style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, color: "white", fontSize: 15, outline: "none" }} />
          </div>
          
          {/* সাবমিট বাটন (Submit Button) - 'loading' স্টেটের উপর ভিত্তি করে কন্ডিশনাল স্টাইলিং ও টেক্সট। */}
          <button id="admin-login-btn" type="submit" disabled={loading} style={{
            marginTop: 8, padding: "14px", background: loading ? "rgba(168,85,247,0.4)" : "linear-gradient(135deg, #9333ea, #7c3aed)",
            border: "none", borderRadius: 12, color: "white", fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
          }}>{loading ? "Signing in..." : "Sign In to Admin"}</button>
        </form>

        {/* ডেমো ক্রেডেনশিয়ালস (Demo Credentials) */}
        <div style={{ marginTop: 24, padding: "12px 16px", background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Demo: admin@nodecommerce.com / Admin@1234</p>
        </div>
      </div>
    </div>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/admin/login/page.tsx`) অ্যাডমিন প্যানেলের এন্ট্রি পয়েন্ট (Entry Point)। এটি একটি ক্লায়েন্ট-সাইড কম্পোনেন্ট ("use client"), যার অর্থ হলো এটি ইউজারের ব্রাউজারে ইন্টারেক্টিভিটি (Interactivity) পরিচালনা করতে পারে। এখানে প্রথাগত REST API কল (`fetch` বা `axios`) না করে নেক্সট.জেএস (Next.js) এর শক্তিশালী ফিচার "সার্ভার অ্যাকশনস (Server Actions)" ব্যবহার করা হয়েছে। ফর্ম সাবমিট হলে `adminLoginAction` সরাসরি কল হয় এবং ব্রাউজার ব্যাকগ্রাউন্ডে একটি RPC (Remote Procedure Call) রিকোয়েস্ট পাঠায়। এটি বয়লারপ্লেট কোড (Boilerplate Code) কমায় এবং ক্লায়েন্ট ও সার্ভারের মধ্যে টাইপ-সেফটি (Type-safety) বজায় রাখে।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এখানে ব্রাউজারের ডিফল্ট ভ্যালিডেশন (`required`, `type="email"`) ব্যবহার করা হয়েছে যা ইউজার এক্সপেরিয়েন্স (UX) উন্নত করে এবং অনর্থক সার্ভার রিকোয়েস্ট কমায়। তবে মূল সিকিউরিটি চেকগুলো (যেমন ইনজেকশন প্রোটেকশন, পাসওয়ার্ড ভেরিফিকেশন) সার্ভার অ্যাকশন (`adminLoginAction`) এর ভেতরেই করা হয়, কারণ ক্লায়েন্ট-সাইড ভ্যালিডেশন সহজেই বাইপাস (Bypass) করা যায়। সফল লগইনের পর সার্ভার থেকে HTTP-only কুকি সেট করা হয়, যা ক্লায়েন্ট-সাইড থেকে অ্যাক্সেসযোগ্য নয় (XSS প্রোটেকশন)।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এখানে ডেটা ফ্লো অত্যন্ত সরল: ইউজার ইনপুট (Client State) -> ফর্ম ডেটা এক্সট্রাকশন (FormData) -> সার্ভার অ্যাকশন ইনভোকেশন (RPC Request) -> সার্ভার রেসপন্স (Success Redirect or Error String) -> এরর স্টেট আপডেট (Client State Update)। সার্ভার অ্যাকশন থেকে যদি কোনো এরর অবজেক্ট `{ error: "..." }` ফেরত আসে, সেটি ক্লায়েন্ট স্টেটে (`setError`) সেভ হয় এবং UI তে রেন্ডার হয়।
================================================================================
*/
