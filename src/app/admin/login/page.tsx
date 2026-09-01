"use client";

import { useState } from "react";
import { adminLoginAction } from "@/actions/admin";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await adminLoginAction(fd);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(13,13,20,0.95)", border: "1px solid rgba(168,85,247,0.2)",
        borderRadius: 24, padding: "40px 36px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
      }}>
        {/* Logo */}
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

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#f87171", fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Admin Email</label>
            <input id="admin-email" name="email" type="email" required placeholder="admin@nodecommerce.com"
              style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, color: "white", fontSize: 15, outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Password</label>
            <input id="admin-password" name="password" type="password" required placeholder="••••••••"
              style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, color: "white", fontSize: 15, outline: "none" }} />
          </div>
          <button id="admin-login-btn" type="submit" disabled={loading} style={{
            marginTop: 8, padding: "14px", background: loading ? "rgba(168,85,247,0.4)" : "linear-gradient(135deg, #9333ea, #7c3aed)",
            border: "none", borderRadius: 12, color: "white", fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
          }}>{loading ? "Signing in..." : "Sign In to Admin"}</button>
        </form>

        <div style={{ marginTop: 24, padding: "12px 16px", background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Demo: admin@nodecommerce.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
