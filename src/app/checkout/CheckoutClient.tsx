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

  async function handlePlaceOrder(e: React.FormEvent<HTMLFormElement>) {
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
    { value: "cod", label: "Cash on Delivery", icon: "💵" },
    { value: "bkash", label: "bKash", icon: "📱" },
    { value: "nagad", label: "Nagad", icon: "📱" },
    { value: "card", label: "Credit/Debit Card", icon: "💳" },
  ];

  return (
    <form onSubmit={handlePlaceOrder}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Shipping Address */}
          <div style={{
            background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: 24,
          }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 20 }}>
              📍 Shipping Address
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
                🚚 Select Courier
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
              💳 Payment Method
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
                  <span style={{ fontSize: 18 }}>{pm.icon}</span>
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
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Total</span>
              <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 24 }}>
                ৳{(cart.subtotal + shippingFee).toLocaleString()}
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
            }}>⚠️ {error}</div>
          )}

          <button
            id="place-order-btn"
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "16px",
              background: loading ? "rgba(234,179,8,0.5)" : "linear-gradient(135deg, #eab308, #ca8a04)",
              border: "none", borderRadius: 14, color: "white",
              fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 17,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Placing Order..." : "✅ Place Order"}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 12 }}>
            🔒 By placing your order, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 10, color: "white", fontSize: 14, outline: "none",
};
