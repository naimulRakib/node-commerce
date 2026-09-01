"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/products", label: "Products", icon: "🛍️" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/couriers", label: "Couriers", icon: "🚚" },
  { href: "/admin/coupons", label: "Coupons", icon: "🏷️" },
];

export default function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 240, minHeight: "100vh", flexShrink: 0,
      background: "#0d0d14",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      position: "sticky", top: 0, height: "100vh",
    }}>
      {/* Logo */}
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

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {navItems.map((item) => {
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

      {/* Admin info + logout */}
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
