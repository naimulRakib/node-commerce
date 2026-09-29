"use client";

import { useState } from "react";
import { placeOrderAction } from "@/actions/order";
import { addAddressAction } from "@/actions/order";

type Address = {
  address_id: number;
  label: string;
  address_line1: string;
  city: string;
  district: string | null;
  is_default: boolean;
};

type Courier = {
  courier_id: number;
  name: string;
};

type CartSummary = {
  subtotal: number;
  itemCount: number;
};

export default function CheckoutClient({
  addresses,
  couriers,
  cart,
}: {
  addresses: Address[];
  couriers: Courier[];
  cart: CartSummary;
}) {
  const [selectedAddress, setSelectedAddress] = useState<number | null>(
    addresses.find(a => a.is_default)?.address_id ?? addresses[0]?.address_id ?? null
  );
  const [selectedCourier, setSelectedCourier] = useState<number | null>(couriers[0]?.courier_id ?? null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addAddrError, setAddAddrError] = useState("");

  const shippingFee = cart.subtotal >= 999 ? 0 : 60;
  // Calculate VAT based on base total (similar to backend logic in transactions.ts)
  const baseTotal = cart.subtotal + shippingFee;
  const vatAmount = baseTotal * 0.05;
  const totalAmount = baseTotal + vatAmount;

  async function handlePlaceOrder(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!selectedAddress) { setError("Please select a shipping address"); return; }
    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.append("shippingAddressId", String(selectedAddress));
    if (selectedCourier) fd.append("courierId", String(selectedCourier));
    if (couponCode) fd.append("couponCode", couponCode.toUpperCase());
    fd.append("paymentMethod", paymentMethod);

    const result = await placeOrderAction(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success, redirect happens in server action
  }

  async function handleAddAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append("is_default", "on");
    const result = await addAddressAction(fd);
    if (result?.error) { setAddAddrError(result.error); return; }
    setShowAddAddress(false);
    window.location.reload();
  }

  const paymentMethods = [
    { value: "cod", label: "Cash on Delivery", icon: <img src="/demo/cod.jpg" alt="COD" style={{width: 24, height: 24, borderRadius: 4, objectFit: "cover"}} /> },
    { value: "bkash", label: "bKash", icon: <img src="/demo/bkash.jpg" alt="bKash" style={{width: 24, height: 24, borderRadius: 4, objectFit: "cover"}} /> },
    { value: "nagad", label: "Nagad", icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" style={{ borderRadius: 4, background: "#f97316" }}>
        <path d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 6"/>
        <circle cx="12" cy="12" r="3" fill="white" />
      </svg>
    )},
    { value: "card", label: "Credit/Debit Card", icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" style={{ borderRadius: 4, background: "#1e293b" }}>
        <rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
        <line x1="2" y1="10" x2="22" y2="10" stroke="white" strokeWidth="1.5" />
        <rect x="16" y="14" width="4" height="2" rx="0.5" fill="white" />
      </svg>
    )},
    { value: "wallet", label: "Wallet Balance", icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" style={{ borderRadius: 4, background: "#8b5cf6" }}>
        <path d="M20 7V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M22 12c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4z" fill="white" />
      </svg>
    )},
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Shipping Address */}
          <div style={{
            background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: 24,
          }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 20 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> Shipping Address
            </h2>
            {addresses.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 16 }}>No saved addresses. Add one below.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {addresses.map(addr => (
                  <label key={addr.address_id} style={{
                    display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer",
                    padding: 16, borderRadius: 14,
                    background: selectedAddress === addr.address_id ? "rgba(234,179,8,0.08)" : "rgba(255,255,255,0.02)",
                    border: selectedAddress === addr.address_id ? "1px solid rgba(234,179,8,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <input type="radio" checked={selectedAddress === addr.address_id}
                      onChange={() => setSelectedAddress(addr.address_id)}
                      style={{ marginTop: 3, accentColor: "#eab308" }} />
                    <div>
                      <div style={{ fontWeight: 600, color: "white", fontSize: 14, marginBottom: 4 }}>
                        {addr.label.charAt(0).toUpperCase() + addr.label.slice(1)}
                        {addr.is_default && <span style={{ marginLeft: 8, fontSize: 11, color: "#eab308" }}>Default</span>}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                        {addr.address_line1}, {addr.city}{addr.district ? `, ${addr.district}` : ""}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setShowAddAddress(!showAddAddress)} style={{
              fontSize: 13, color: "#eab308", background: "none", border: "1px dashed rgba(234,179,8,0.3)",
              borderRadius: 10, padding: "8px 16px", cursor: "pointer",
            }}>+ Add New Address</button>

            {showAddAddress && (
              <form onSubmit={handleAddAddress} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                {addAddrError && <p style={{ color: "#f87171", fontSize: 13 }}>{addAddrError}</p>}
                <input name="address_line1" required placeholder="Address Line 1 *" style={inputStyle} />
                <input name="address_line2" placeholder="Address Line 2" style={inputStyle} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input name="city" required placeholder="City *" style={inputStyle} />
                  <input name="district" placeholder="District" style={inputStyle} />
                </div>
                <input name="postal_code" placeholder="Postal Code" style={inputStyle} />
                <button type="submit" style={{
                  padding: "10px", background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)",
                  borderRadius: 10, color: "#eab308", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Save Address</button>
              </form>
            )}
          </div>

          {/* Courier Selection */}
          {couriers.length > 0 && (
            <div style={{
              background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20, padding: 24,
            }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 20 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="15" height="13" x="1" y="3" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> Select Courier
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {couriers.map(c => (
                  <label key={c.courier_id} style={{
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                    padding: 14, borderRadius: 12,
                    background: selectedCourier === c.courier_id ? "rgba(234,179,8,0.08)" : "rgba(255,255,255,0.02)",
                    border: selectedCourier === c.courier_id ? "1px solid rgba(234,179,8,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <input type="radio" checked={selectedCourier === c.courier_id}
                      onChange={() => setSelectedCourier(c.courier_id)}
                      style={{ accentColor: "#eab308" }} />
                    <div>
                      <div style={{ fontWeight: 600, color: "white", fontSize: 14 }}>{c.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>3-5 business days</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div style={{
            background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: 24,
          }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 20 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg> Payment Method
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {paymentMethods.map(pm => (
                <label key={pm.value} style={{
                  display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                  padding: 14, borderRadius: 12,
                  background: paymentMethod === pm.value ? "rgba(234,179,8,0.08)" : "rgba(255,255,255,0.02)",
                  border: paymentMethod === pm.value ? "1px solid rgba(234,179,8,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                  <input type="radio" checked={paymentMethod === pm.value}
                    onChange={() => setPaymentMethod(pm.value)}
                    style={{ accentColor: "#eab308" }} />
                  <span style={{ display: "flex", alignItems: "center" }}>{pm.icon}</span>
                  <span style={{ color: paymentMethod === pm.value ? "white" : "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: paymentMethod === pm.value ? 600 : 400 }}>
                    {pm.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div style={{
          background: "rgba(22,22,31,0.9)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20, padding: 28, position: "sticky", top: 100,
        }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 22, color: "white", marginBottom: 24 }}>
            Order Summary
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Subtotal ({cart.itemCount} items)</span>
              <span style={{ color: "white", fontWeight: 600 }}>৳{cart.subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Shipping Fee</span>
              <span style={{ color: shippingFee === 0 ? "#4ade80" : "white", fontWeight: 600 }}>
                {shippingFee === 0 ? "FREE" : `৳${shippingFee}`}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>VAT (5%)</span>
              <span style={{ color: "white", fontWeight: 600 }}>৳{vatAmount.toFixed(2)}</span>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Total Billed</span>
              <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 24 }}>
                ৳{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Coupon */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Coupon code (optional)"
              style={{ ...inputStyle, width: "100%", marginBottom: 0 }}
            />
          </div>

          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 12, marginBottom: 16,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171", fontSize: 14,
            }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> {error}</div>
          )}

          <button
            id="place-order-btn"
            type="button"
            onClick={handlePlaceOrder}
            disabled={loading}
            style={{
              width: "100%", padding: "16px",
              background: loading ? "rgba(234,179,8,0.5)" : "linear-gradient(135deg, #eab308, #ca8a04)",
              border: "none", borderRadius: 14, color: "white",
              fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 17,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Placing Order..." : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Place Order
              </span>
            )}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 12 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> By placing your order, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 10, color: "white", fontSize: 14, outline: "none",
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
