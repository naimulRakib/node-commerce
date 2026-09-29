"use client";

import { useState } from "react";
import { addMoneyAction } from "@/actions/wallet";

export default function AddMoneyClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (phone !== "01927300804" || pin !== "12345") {
      setError("Invalid bKash credentials. Please try again.");
      setLoading(false);
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount");
      setLoading(false);
      return;
    }

    const res = await addMoneyAction(numAmount);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setAmount("");
      setPhone("");
      setPin("");
      setTimeout(() => setIsOpen(false), 2000);
    }
    setLoading(false);
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          marginTop: 16,
          background: "linear-gradient(135deg, #e3365e, #b81c40)", // bKash brand colors
          border: "none", borderRadius: 12, color: "white", padding: "12px 24px",
          fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 15px rgba(227, 54, 94, 0.4)"
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Money with bKash
      </button>

      {isOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "rgba(22,22,31,1)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24, padding: 32, width: "100%", maxWidth: 400, position: "relative"
          }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 20 }}
            >
              ✕
            </button>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, color: "white", fontSize: 24, marginBottom: 8, textAlign: "center" }}>bKash Payment Gateway</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", marginBottom: 24 }}>Add money to your NodeCommerce Wallet</p>

            {success ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
                <div style={{ color: "#4ade80", fontSize: 18, fontWeight: 700 }}>Payment Successful!</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 8 }}>Money added to your wallet.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {error && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "10px 14px", borderRadius: 10, fontSize: 14, border: "1px solid rgba(239,68,68,0.3)" }}>{error}</div>}
                
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>Amount (৳)</label>
                  <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 500" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>bKash Account Number</label>
                  <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>bKash PIN</label>
                  <input type="password" required value={pin} onChange={e => setPin(e.target.value)} placeholder="•••••" style={inputStyle} />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    marginTop: 8, background: "#e3365e", color: "white", padding: "14px",
                    borderRadius: 12, border: "none", fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? "Processing..." : "Confirm Payment"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, color: "white", fontSize: 15, outline: "none",
};


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
