// রিঅ্যাক্ট (React) এর 'ReactNode' টাইপ ইমপোর্ট করা হচ্ছে, যা চিলড্রেন (children) প্রপসের টাইপ হিসেবে ব্যবহৃত হবে।
import { ReactNode } from "react";
// ক্লায়েন্ট-সাইড রাউটিং এর জন্য নেক্সট.জেএস (Next.js) এর 'Link' কম্পোনেন্ট ইমপোর্ট করা হচ্ছে।
import Link from "next/link";

// এটি প্রমাণীকরণ (Authentication) এরিয়াগুলোর জন্য একটি লেআউট (Layout) কম্পোনেন্ট। 
// এটি 'login' এবং 'register' পেজগুলোর প্যারেন্ট (Parent) হিসেবে কাজ করবে।
export default function AuthLayout({ children }: { children: ReactNode }) {
  // ইউজার ইন্টারফেস (User Interface) রেন্ডারিং:
  return (
    // মূল কন্টেইনার (Main Container) যা পুরো স্ক্রিন জুড়ে থাকবে।
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)", // গ্লোবাল সিএসএস ভ্যারিয়েবল থেকে ব্যাকগ্রাউন্ড কালার
      display: "flex",
      flexDirection: "column",
      alignItems: "center", // অনুভূমিকভাবে (Horizontally) মাঝখানে আনা
      justifyContent: "center", // উল্লম্বভাবে (Vertically) মাঝখানে আনা
      padding: "24px",
      position: "relative",
      overflow: "hidden", // কোনো উপাদান বাইরে চলে গেলে তা হাইড করা
    }}>
      {/* ব্যাকগ্রাউন্ড অর্বস (Background Orbs): নান্দনিকতা (Aesthetics) বৃদ্ধির জন্য গ্রেডিয়েন্ট ইফেক্ট */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 50% at 20% 30%, rgba(234,179,8,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 70%, rgba(168,85,247,0.05) 0%, transparent 60%)",
      }} />

      {/* লোগো (Logo): হোমপেজে ফিরে যাওয়ার জন্য নেভিগেশন লিংক */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* লোগো আইকন (Logo Icon) */}
          <div style={{
            width: 44, height: 44,
            background: "linear-gradient(135deg, #eab308, #ca8a04)",
            borderRadius: 14, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 24, fontWeight: 900, color: "white",
            boxShadow: "0 4px 20px rgba(234,179,8,0.4)",
          }}>N</div>
          {/* ব্র্যান্ড নেম (Brand Name) */}
          <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 26, color: "white" }}>
            Node<span className="gradient-text">Commerce</span>
          </span>
        </div>
      </Link>

      {/* চিলড্রেন (Children): এখানে মূলত 'login' বা 'register' পেজের কন্টেন্ট রেন্ডার হবে */}
      {children}
    </div>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/(auth)/layout.tsx`) নেক্সট.জেএস-এর রাউট গ্রুপ (Route Group - `(auth)`) এর জন্য একটি লেআউট কম্পোনেন্ট। 라উট গ্রুপের ফোল্ডারের নামে ফাস্ট ব্র্যাকেট `()` থাকায় এটি URL-এ কোনো প্রভাব ফেলে না (যেমন: `/auth/login` না হয়ে সরাসরি `/login` হয়)। এটি লগ-ইন এবং রেজিস্টার পেজের জন্য একটি সাধারণ স্ট্রাকচার (কমন ব্যাকগ্রাউন্ড, সেন্ট্রাল এলাইনমেন্ট এবং লোগো) তৈরি করে।

২. ইউআই ও ডিজাইন (UI & Design):
এখানে ফ্লেক্সবক্স (Flexbox) ব্যবহার করে কন্টেন্টগুলোকে স্ক্রিনের ঠিক মাঝখানে আনা হয়েছে (`alignItems: "center"`, `justifyContent: "center"`), যা ইউজার এক্সপেরিয়েন্সকে (User Experience) সাবলীল করে। এছাড়া, একটি ফিক্সড (fixed) পজিশনড ডিভ ব্যবহার করে নান্দনিক "রেডিয়াল গ্রেডিয়েন্ট (Radial Gradient)" ব্যাকগ্রাউন্ড তৈরি করা হয়েছে যা প্রমাণীকরণ পেজগুলোকে প্রিমিয়াম একটি লুক (Premium Look) দেয়। `pointerEvents: "none"` ব্যবহার করা হয়েছে যাতে ব্যাকগ্রাউন্ডটি ইউজারের ক্লিক বা অন্যান্য ইন্টারঅ্যাকশনে বাধা সৃষ্টি না করে।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এটি একটি সাধারণ সার্ভার কম্পোনেন্ট (Server Component) যা শুধুমাত্র প্রেজেন্টেশন (Presentation) বা লেআউটের জন্য দায়ী। এর মধ্যে কোনো জটিল ডাটা ফেচিং (Data Fetching) বা এপিআই কল নেই। এটি কেবল প্রপস হিসেবে `children` রিসিভ করে এবং তার নিজস্ব কাঠামোর মধ্যে রেন্ডার করে।
================================================================================
*/
