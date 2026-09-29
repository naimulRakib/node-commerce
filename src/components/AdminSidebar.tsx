// এই নির্দেশিকাটি নেক্সট.জেএস কে বলে দেয় যে এটি একটি 'ক্লায়েন্ট কম্পোনেন্ট'।
"use client";

import Link from "next/link";
// বর্তমান URL প্যাথ (Path) পাওয়ার জন্য নেক্সট.জেএস হুক।
import { usePathname } from "next/navigation";

// অ্যাডমিন প্যানেলের নেভিগেশন আইটেমগুলোর তালিকা।
const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { href: "/admin/orders", label: "Orders", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> },
  { href: "/admin/products", label: "Products", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { href: "/admin/categories", label: "Categories", icon: "🗂️" },
  { href: "/admin/customers", label: "Customers", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: "/admin/couriers", label: "Couriers", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="15" height="13" x="1" y="3" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { href: "/admin/coupons", label: "Coupons", icon: "🏷️" },
];

export default function AdminSidebar({ adminName }: { adminName: string }) {
  // ১. প্যাথনেম এক্সট্রাকশন (Pathname Extraction):
  const pathname = usePathname();

  // ২. রেন্ডারিং (Rendering):
  return (
    <aside style={{
      width: 240, minHeight: "100vh", flexShrink: 0,
      background: "#0d0d14",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      position: "sticky", top: 0, height: "100vh",
    }}>
      {/* 2a. Logo Section */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: "linear-gradient(135deg, #eab308, #ca8a04)",
              borderRadius: 10, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 18, fontWeight: 900, color: "white",
            }}>N</div>
            <div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 16, color: "white" }}>
                Node<span style={{ color: "#eab308" }}>Commerce</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Admin Panel</div>
            </div>
          </div>
        </Link>
      </div>

      {/* 2b. Navigation Links */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {navItems.map((item) => {
          // অ্যাক্টিভ স্টেট ক্যালকুলেশন (Active State Calculation):
          // যদি exact=true হয়, তবে হুবহু মিলতে হবে। অন্যথায় startsWith দিয়ে চেক করা হবে।
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", borderRadius: 12, marginBottom: 4,
              textDecoration: "none",
              background: isActive ? "rgba(234,179,8,0.1)" : "transparent",
              color: isActive ? "#eab308" : "rgba(255,255,255,0.55)",
              fontWeight: isActive ? 600 : 400,
              fontSize: 14, transition: "all 0.2s ease",
              border: isActive ? "1px solid rgba(234,179,8,0.2)" : "1px solid transparent",
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 2c. Admin Profile & Action */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 50,
            background: "linear-gradient(135deg, rgba(234,179,8,0.3), rgba(168,85,247,0.3))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, border: "1px solid rgba(234,179,8,0.2)",
          }}>👤</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{adminName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Administrator</div>
          </div>
        </div>
        <Link href="/" style={{
          display: "block", textAlign: "center",
          padding: "8px", borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          color: "rgba(255,255,255,0.5)", fontSize: 13,
          textDecoration: "none",
        }}>← View Store</Link>
      </div>
    </aside>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/components/AdminSidebar.tsx`) অ্যাডমিন প্যানেলের জন্য একটি সাইডবার নেভিগেশন (Sidebar Navigation) তৈরি করে। এটি একটি "Client Component" (`use client`), যার মানে হলো এটি ব্রাউজারের API যেমন `usePathname` হুক ব্যবহার করতে পারে।

২. ডাইনামিক রাউটিং ও অ্যাক্টিভ স্টেট (Dynamic Routing & Active State):
এখানে `usePathname` হুক ব্যবহার করে বর্তমান URL প্যাথ নির্ণয় করা হয়। `navItems` অ্যারে লুপ করার সময় `pathname.startsWith(item.href)` লজিকটি ব্যবহার করে নির্ধারণ করা হয় যে নির্দিষ্ট নেভিগেশন লিংকটি বর্তমানে 'অ্যাক্টিভ' (Active) কি না। অ্যাক্টিভ লিংকের জন্য ভিন্ন কালার এবং ব্যাকগ্রাউন্ড স্টাইল প্রয়োগ করা হয় (Conditional Styling), যা ইউজার এক্সপেরিয়েন্স (UX) উন্নত করে।
================================================================================
*/
