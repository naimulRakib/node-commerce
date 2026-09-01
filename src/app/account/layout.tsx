import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const accountNav = [
  { href: "/account", label: "Dashboard", icon: "📊", exact: true },
  { href: "/account/orders", label: "My Orders", icon: "📦" },
  { href: "/account/wishlist", label: "Wishlist", icon: "❤️" },
  { href: "/account/wallet", label: "Wallet", icon: "💰" },
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
