import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const accountNav = [
  { href: "/account", label: "Dashboard", icon: "📊", exact: true },
  { href: "/account/orders", label: "My Orders", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> },
  { href: "/account/wishlist", label: "Wishlist", icon: "❤️" },
  { href: "/account/wallet", label: "Wallet", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { href: "/account/profile", label: "Profile", icon: "👤" },
];

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await requireCustomer().catch(() => null);
  if (!session) redirect("/login");

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "100vh" }}>
        <div className="container" style={{ padding: "32px 24px", display: "flex", gap: 28 }}>
          {/* Sidebar */}
          <aside style={{ width: 220, flexShrink: 0 }}>
            <div style={{
              background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20, padding: 20, position: "sticky", top: 100,
            }}>
              <div style={{ padding: "0 0 16px", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 15 }}>
                  {session.name}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                  {session.email}
                </div>
              </div>
              {accountNav.map(item => (
                <Link key={item.href} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, marginBottom: 4,
                  textDecoration: "none", fontSize: 14,
                  color: "rgba(255,255,255,0.55)",
                }}>
                  <span>{item.icon}</span> {item.label}
                </Link>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}


/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি প্রোজেক্টের একটি ইউটিলিটি (Utility) বা সাপোর্টিং মডিউল হিসেবে কাজ করে। টাইপস্ক্রিপ্ট (TypeScript) ব্যবহারের কারণে এতে স্ট্যাটিক টাইপ চেকিং (Static Type Checking) নিশ্চিত হয়, যা রানটাইম এরর (Runtime Error) হওয়ার সম্ভাবনা অনেকাংশে কমিয়ে দেয়।

২. লজিক (Logic):
এখানে নির্দিষ্ট কিছু হেল্পার ফাংশন, কনফিগারেশন বা টাইপ ডেফিনেশন থাকতে পারে যা প্রোজেক্টের বিভিন্ন অংশে ইমপোর্ট করে ব্যবহার করা হয় (DRY Principle - Don't Repeat Yourself)।

৩. ব্যবহারিক গুরুত্ব (Practical Significance):
কোডবেসকে ক্লিন (Clean) এবং মডুলার (Modular) রাখার জন্য এ ধরনের শেয়ার্ড ফাইলের গুরুত্ব অপরিসীম।
================================================================================
*/
