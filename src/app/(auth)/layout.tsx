import { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background orbs */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 50% at 20% 30%, rgba(234,179,8,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 70%, rgba(168,85,247,0.05) 0%, transparent 60%)",
      }} />

      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44,
            background: "linear-gradient(135deg, #eab308, #ca8a04)",
            borderRadius: 14, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 24, fontWeight: 900, color: "white",
            boxShadow: "0 4px 20px rgba(234,179,8,0.4)",
          }}>N</div>
          <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 26, color: "white" }}>
            Node<span className="gradient-text">Commerce</span>
          </span>
        </div>
      </Link>

      {children}
    </div>
  );
}
