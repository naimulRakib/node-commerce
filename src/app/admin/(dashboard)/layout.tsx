// রিয়েক্ট (React) এর টাইপ ডেফিনিশন, যা চিলড্রেন প্রপস (Children Props) টাইপ করার জন্য ব্যবহৃত হয়।
import { ReactNode } from "react";
// অ্যাডমিন রাউটের জন্য গ্লোবাল অথেন্টিকেশন (Global Authentication) চেকার।
import { requireAdmin } from "@/lib/auth";
// সাইডবার নেভিগেশন (Sidebar Navigation) কম্পোনেন্ট।
import AdminSidebar from "@/components/AdminSidebar";
// অ্যাডমিন লগআউট করার জন্য সার্ভার অ্যাকশন।
import { adminLogoutAction } from "@/actions/admin";

// ─── অ্যাডমিন লেআউট (Admin Layout) ───────────────────────────────────────────
// এই লেআউটটি '/admin' ডিরেক্টরির অধীনে থাকা সকল রাউটকে র‍্যাপ (Wrap) করবে।
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // ১. রাউট প্রোটেকশন (Route Protection): 
  // এই ফাংশনটি সার্ভার-সাইডে এক্সিকিউট হয়। এটি কল করার মাধ্যমে নিশ্চিত করা হয় যে 
  // এই লেআউট এবং এর ভেতরের সকল চাইল্ড রাউটে (Child Routes) শুধুমাত্র ভ্যালিড অ্যাডমিনরাই প্রবেশ করতে পারবে।
  // সেশন না থাকলে এটি স্বয়ংক্রিয়ভাবে লগইন পেজে রিডাইরেক্ট (Redirect) করবে।
  const session = await requireAdmin();

  // ২. লেআউট রেন্ডারিং (Layout Rendering):
  return (
    // মূল কনটেইনার: পুরো ভিউপোর্ট (Viewport) জুড়ে গাঢ় রঙের থিম (Dark Theme) প্রয়োগ করা হয়েছে।
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0f" }}>
      {/* বাম দিকের সাইডবার: সেশন থেকে প্রাপ্ত অ্যাডমিনের নাম প্রপস (Props) হিসেবে পাঠানো হচ্ছে */}
      <AdminSidebar adminName={session.name} />

      {/* ডান দিকের মূল কনটেন্ট এরিয়া (Main Content Area) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* টপ বার (Top Bar) / হেডার */}
        <header style={{
          height: 60, display: "flex", alignItems: "center", justifyContent: "flex-end",
          padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.05)",
          // গ্লাসমরফিজম (Glassmorphism) ইফেক্ট: ব্যাকগ্রাউন্ড ব্লার এবং সেমি-ট্রান্সপারেন্ট কালার।
          background: "rgba(10,10,15,0.9)", backdropFilter: "blur(10px)",
          // স্ক্রল করার সময় হেডারটি যেন উপরে ফিক্সড (Fixed) থাকে।
          position: "sticky", top: 0, zIndex: 50,
        }}>
          {/* লগআউট ফর্ম: এটি সরাসরি সার্ভার অ্যাকশন কল করবে */}
          <form action={adminLogoutAction}>
            <button type="submit" style={{
              padding: "8px 18px", borderRadius: 10,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171", fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>Logout</button>
          </form>
        </header>

        {/* পেজ কনটেন্ট (Page Content): ডায়নামিক রাউটগুলো (Children) এখানে রেন্ডার হবে */}
        <main style={{ flex: 1, padding: 28, overflow: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/admin/layout.tsx`) একটি নেস্টেড লেআউট (Nested Layout) প্যাটার্নের অংশ। নেক্সট.জেএস (Next.js) এর অ্যাপ রাউটার (App Router) আর্কিটেকচারে, কোনো ফোল্ডারে `layout.tsx` থাকলে সেটি তার ভেতরের সকল পেজের জন্য একটি কমন র‍্যাপার (Common Wrapper) হিসেবে কাজ করে। এটি পেজ নেভিগেশনের সময় আনমাউন্ট (Unmount) হয় না, যার ফলে সাইডবার এবং হেডারের মতো গ্লোবাল স্টেটগুলো (Global States) ধরে রাখা সম্ভব হয়। 

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এখানে `requireAdmin()` ফাংশনটির প্লেসমেন্ট অত্যন্ত ক্রিটিকাল। লেআউট ফাইলে এটি কল করার মানে হলো, `/admin` বা এর ভেতরের যেকোনো সাব-রাউটে (Sub-route) হিট করলেই সবার আগে সেশন যাচাই করা হবে। এটি একটি গ্লোবাল গার্ড (Global Guard) হিসেবে কাজ করে। যদি কোনো আক্রমণকারী (Attacker) সরাসরি `/admin/orders/1` এ প্রবেশ করার চেষ্টা করে, এই লেআউটের কারণে সে বাধাপ্রাপ্ত হবে। লগআউট বাটনে কোনো ক্লায়েন্ট-সাইড জাভাস্ক্রিপ্ট ব্যবহার না করে সরাসরি সার্ভার অ্যাকশন (`adminLogoutAction`) ব্যবহার করা হয়েছে, যা প্রগ্রেসিভ এনহ্যান্সমেন্ট (Progressive Enhancement) নিশ্চিত করে (এমনকি জাভাস্ক্রিপ্ট ডিসেবল থাকলেও কাজ করবে)।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই ফাইলটি মূলত প্রেজেন্টেশনাল (Presentational) হলেও, এটি কুকি-বেসড সেশন (Cookie-based Session) থেকে ইউজারনেম রিড করে এবং সাইডবার কম্পোনেন্টে পাস করে। এটি একমুখী ডেটা প্রবাহের (Unidirectional Data Flow) একটি প্রকৃষ্ট উদাহরণ, যেখানে সার্ভার থেকে ডেটা প্রপস (Props) এর মাধ্যমে চাইল্ড কম্পোনেন্টে প্রবাহিত হয়।
================================================================================
*/
