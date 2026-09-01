"use client";

import { useState } from "react";
import { createCouponAction, toggleCouponAction } from "@/actions/admin";

type Coupon = {
  code: string;
  discount_type: string;
  discount_value: number | string;
  min_spend: number | string;
  max_discount: number | string | null;
  usage_count: number;
  usage_limit: number | null;
  expiry_date: Date | null;
  is_active: boolean;
};

export default function AdminCouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await createCouponAction(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.reload();
    }
  }

  async function handleToggle(code: string, current: boolean) {
    await toggleCouponAction(code, !current);
    setCoupons(prev => prev.map(c => c.code === code ? { ...c, is_active: !current } : c));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white" }}>
          Coupons
        </h1>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: "11px 22px", background: showForm ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #eab308, #ca8a04)",
          border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>
          {showForm ? "Cancel" : "+ Add Coupon"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 16 }}>Create New Coupon</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Code *</label>
                <input name="code" required placeholder="SUMMER20" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Discount Type</label>
                <select name="discount_type" style={inputStyle}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (৳)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Discount Value *</label>
                <input name="discount_value" type="number" min="1" required placeholder="e.g. 20" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Min Spend (৳) *</label>
                <input name="min_spend" type="number" min="0" required placeholder="500" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Max Discount (৳)</label>
                <input name="max_discount" type="number" min="0" placeholder="Optional limit" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Usage Limit</label>
                <input name="usage_limit" type="number" min="1" placeholder="Optional limit" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Expiry Date</label>
                <input name="expiry_date" type="datetime-local" style={inputStyle} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              alignSelf: "flex-start", padding: "12px 24px", background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.3)", borderRadius: 12, color: "#eab308", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
              {loading ? "Creating..." : "Save Coupon"}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {coupons.map((coupon) => {
          const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
          const isExhausted = coupon.usage_limit && coupon.usage_count >= coupon.usage_limit;
          
          return (
            <div key={coupon.code} style={{
              background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20, padding: 20, opacity: coupon.is_active ? 1 : 0.6,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "#eab308", letterSpacing: 1, padding: "4px 10px", background: "rgba(234,179,8,0.1)", borderRadius: 8, display: "inline-block" }}>
                    {coupon.code}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
                    {coupon.discount_type === "percentage" ? `${Number(coupon.discount_value)}% OFF` : `৳${Number(coupon.discount_value)} OFF`}
                  </div>
                </div>
                <button onClick={() => handleToggle(coupon.code, coupon.is_active)} style={{
                  background: "none", border: "none", fontSize: 24, cursor: "pointer",
                  color: coupon.is_active ? "#4ade80" : "rgba(255,255,255,0.2)"
                }}>
                  {coupon.is_active ? "🟢" : "⚫"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                <div>Min Spend: <strong style={{ color: "white" }}>৳{Number(coupon.min_spend)}</strong></div>
                {coupon.max_discount && <div>Max Discount: <strong style={{ color: "white" }}>৳{Number(coupon.max_discount)}</strong></div>}
                <div>Used: <strong style={{ color: "white" }}>{coupon.usage_count}</strong> {coupon.usage_limit ? `/ ${coupon.usage_limit}` : "times"}</div>
                {coupon.expiry_date && (
                  <div style={{ color: isExpired ? "#f87171" : "inherit" }}>
                    Expires: {new Date(coupon.expiry_date).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              {(isExpired || isExhausted) && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#f87171", padding: "4px 8px", background: "rgba(239,68,68,0.1)", borderRadius: 6, display: "inline-block" }}>
                  {isExpired ? "Expired" : "Usage limit reached"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", fontSize: 14, outline: "none" };
