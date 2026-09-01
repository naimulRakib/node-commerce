"use client";

import { useState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await registerAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div style={{
      width: "100%", maxWidth: 480,
      background: "rgba(22,22,31,0.9)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 24, padding: "40px 36px",
      boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      backdropFilter: "blur(20px)",
    }}>
      <h1 style={{
        fontFamily: "Outfit, sans-serif", fontWeight: 800,
        fontSize: 28, color: "white", marginBottom: 8, textAlign: "center",
      }}>Create Account</h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center", marginBottom: 32 }}>
        Join NodeCommerce and start shopping
      </p>

      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 20,
          color: "#f87171", fontSize: 14,
        }}>⚠️ {error}</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input id="reg-name" type="text" name="name" required placeholder="Rahim Uddin" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Email Address *</label>
          <input id="reg-email" type="email" name="email" required placeholder="your@email.com" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Phone Number</label>
          <input id="reg-phone" type="tel" name="phone" placeholder="01XXXXXXXXX" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Password *</label>
          <input id="reg-password" type="password" name="password" required placeholder="Min. 6 characters" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Confirm Password *</label>
          <input id="reg-confirm" type="password" name="confirm" required placeholder="Repeat password" style={inputStyle} />
        </div>

        <button
          id="register-submit-btn"
          type="submit"
          disabled={loading}
          style={{
            marginTop: 8, padding: "14px",
            background: loading ? "rgba(234,179,8,0.5)" : "linear-gradient(135deg, #eab308, #ca8a04)",
            border: "none", borderRadius: 12, color: "white",
            fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating account..." : "Create Account →"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#eab308", textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 500,
  color: "rgba(255,255,255,0.6)", marginBottom: 8,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 12, color: "white", fontSize: 15, outline: "none",
};
