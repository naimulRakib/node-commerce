"use client";

import { useState } from "react";
import Link from "next/link";
import { updateCartItemAction, removeCartItemAction } from "@/actions/cart";
import { validateCouponAction } from "@/actions/cart";

type CartItem = {
  cart_item_id: number;
  quantity: number;
  product: { product_id: number; name: string; base_price: number };
  variant: { variant_code: string; color: string | null; size: string | null; price_override: number | null } | null;
};

export default function CartClientPage({ items }: { items: CartItem[] }) {
  const [cartItems, setCartItems] = useState(items);
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState<number | null>(null);

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.variant?.price_override ?? item.product.base_price;
    return sum + price * item.quantity;
  }, 0);
  const shippingFee = subtotal >= 999 ? 0 : 60;
  const total = subtotal - discount + shippingFee;

  async function handleQtyChange(itemId: number, newQty: number) {
    setLoading(itemId);
    if (newQty < 1) {
      await removeCartItemAction(itemId);
      setCartItems(prev => prev.filter(i => i.cart_item_id !== itemId));
    } else {
      await updateCartItemAction(itemId, newQty);
      setCartItems(prev => prev.map(i => i.cart_item_id === itemId ? { ...i, quantity: newQty } : i));
    }
    setLoading(null);
  }

  async function handleApplyCoupon() {
    if (!couponCode) return;
    const result = await validateCouponAction(couponCode.toUpperCase(), subtotal);
    if (result.valid && result.discountAmount !== undefined) {
      setDiscount(result.discountAmount);
      setCouponMsg(`✅ Coupon applied! Saving ৳${result.discountAmount.toLocaleString()}`);
    } else {
      setCouponMsg(`❌ ${result.error}`);
      setDiscount(0);
    }
  }

  if (cartItems.length === 0) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>🛒</div>
        <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", marginBottom: 12 }}>Your cart is empty</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>Add some products to get started!</p>
        <Link href="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>
      {/* Cart Items */}
      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cartItems.map((item) => {
            const price = item.variant?.price_override ?? item.product.base_price;
            return (
              <div key={item.cart_item_id} style={{
                background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16, padding: 20, display: "flex", gap: 20, alignItems: "center",
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 12,
                  background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, flexShrink: 0,
                }}>🛍️</div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "white", fontSize: 15, marginBottom: 4 }}>
                    {item.product.name}
                  </div>
                  {item.variant && (
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 8 }}>
                      {item.variant.color && `Color: ${item.variant.color}`}
                      {item.variant.size && ` • Size: ${item.variant.size}`}
                    </div>
                  )}
                  <div className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 18 }}>
                    ৳{(price * item.quantity).toLocaleString()}
                  </div>
                </div>

                {/* Quantity */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10,
                  }}>
                    <button onClick={() => handleQtyChange(item.cart_item_id, item.quantity - 1)}
                      disabled={loading === item.cart_item_id}
                      style={{ width: 36, height: 36, background: "none", border: "none", color: "white", fontSize: 16, cursor: "pointer" }}>−</button>
                    <span style={{ width: 28, textAlign: "center", color: "white", fontWeight: 600, fontSize: 14 }}>{item.quantity}</span>
                    <button onClick={() => handleQtyChange(item.cart_item_id, item.quantity + 1)}
                      disabled={loading === item.cart_item_id}
                      style={{ width: 36, height: 36, background: "none", border: "none", color: "white", fontSize: 16, cursor: "pointer" }}>+</button>
                  </div>
                  <button onClick={() => handleQtyChange(item.cart_item_id, 0)}
                    style={{ width: 36, height: 36, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#f87171", cursor: "pointer", fontSize: 16 }}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary */}
      <div style={{
        background: "rgba(22,22,31,0.9)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20, padding: 28, position: "sticky", top: 100,
      }}>
        <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 22, color: "white", marginBottom: 24 }}>
          Order Summary
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Subtotal ({cartItems.length} items)</span>
            <span style={{ color: "white", fontWeight: 600 }}>৳{subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#4ade80", fontSize: 14 }}>Coupon Discount</span>
              <span style={{ color: "#4ade80", fontWeight: 600 }}>−৳{discount.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Shipping Fee</span>
            <span style={{ color: shippingFee === 0 ? "#4ade80" : "white", fontWeight: 600 }}>
              {shippingFee === 0 ? "FREE" : `৳${shippingFee}`}
            </span>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Total</span>
            <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 22 }}>
              ৳{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Coupon */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              style={{
                flex: 1, padding: "10px 14px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 10, color: "white", fontSize: 14, outline: "none",
              }}
            />
            <button id="apply-coupon-btn" onClick={handleApplyCoupon} style={{
              padding: "10px 16px", background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.3)", borderRadius: 10,
              color: "#eab308", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>Apply</button>
          </div>
          {couponMsg && (
            <p style={{ fontSize: 12, marginTop: 8, color: couponMsg.includes("✅") ? "#4ade80" : "#f87171" }}>{couponMsg}</p>
          )}
        </div>

        <Link href="/checkout" style={{
          display: "block", textAlign: "center", padding: "16px",
          background: "linear-gradient(135deg, #eab308, #ca8a04)",
          borderRadius: 14, color: "white",
          fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16,
          textDecoration: "none",
        }}>
          Proceed to Checkout →
        </Link>

        <Link href="/products" style={{
          display: "block", textAlign: "center", marginTop: 12, fontSize: 14,
          color: "rgba(255,255,255,0.4)", textDecoration: "none",
        }}>
          ← Continue Shopping
        </Link>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 8 }}>
          {["💳", "📱", "🏦"].map((icon, i) => (
            <span key={i} style={{ fontSize: 18 }}>{icon}</span>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>
          Secure checkout • SSL encrypted
        </p>
      </div>
    </div>
  );
}
