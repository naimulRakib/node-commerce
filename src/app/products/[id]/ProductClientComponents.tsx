"use client";

import { useState } from "react";
import { addToCartAction, addToWishlistAction } from "@/actions/cart";
import { submitReviewAction } from "@/actions/review";

type Product = {
  product_id: number;
  name: string;
  description: string | null;
  base_price: number;
  category: { name: string } | null;
  variants: Array<{
    variant_code: string;
    color: string | null;
    size: string | null;
    price_override: number | null;
    quantity: number;
    sku: string;
  }>;
  reviews: Array<{
    review_id: number;
    rating: number;
    comment: string | null;
    is_verified: boolean;
    created_at: string;
    customer: { name: string } | null;
  }>;
};

export function AddToCartSection({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants[0]?.variant_code ?? null
  );
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const variant = product.variants.find((v) => v.variant_code === selectedVariant);
  const price = variant?.price_override ?? product.base_price;

  async function handleAddToCart() {
    setLoading(true);
    const result = await addToCartAction(product.product_id, selectedVariant, qty);
    setMsg(result.error ? `❌ ${result.error}` : "✅ Added to cart!");
    setLoading(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleWishlist() {
    const result = await addToWishlistAction(product.product_id, selectedVariant);
    setMsg(result.error ? `❌ ${result.error}` : "❤️ Added to wishlist!");
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div>
      {/* Variant Selection */}
      {product.variants.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {/* Color */}
          {product.variants.some(v => v.color) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
                Color: <strong style={{ color: "white" }}>{variant?.color}</strong>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[...new Set(product.variants.map(v => v.color))].map(color => {
                  const v = product.variants.find(pv => pv.color === color);
                  if (!v) return null;
                  const isSelected = v.variant_code === selectedVariant;
                  return (
                    <button key={color} onClick={() => setSelectedVariant(v.variant_code)}
                      style={{
                        padding: "8px 16px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                        background: isSelected ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)",
                        border: isSelected ? "1px solid #eab308" : "1px solid rgba(255,255,255,0.1)",
                        color: isSelected ? "#eab308" : "rgba(255,255,255,0.6)", fontWeight: isSelected ? 600 : 400,
                      }}>{color}</button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size */}
          {product.variants.some(v => v.size) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
                Size: <strong style={{ color: "white" }}>{variant?.size}</strong>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[...new Set(product.variants.map(v => v.size))].map(size => {
                  const v = product.variants.find(pv => pv.size === size);
                  if (!v) return null;
                  const isSelected = v.variant_code === selectedVariant;
                  return (
                    <button key={size} onClick={() => setSelectedVariant(v.variant_code)}
                      style={{
                        width: 48, height: 48, borderRadius: 10, fontSize: 13, cursor: "pointer",
                        background: isSelected ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)",
                        border: isSelected ? "1px solid #eab308" : "1px solid rgba(255,255,255,0.1)",
                        color: isSelected ? "#eab308" : "rgba(255,255,255,0.6)", fontWeight: isSelected ? 600 : 400,
                      }}>{size}</button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quantity */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Qty:</span>
        <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10 }}>
          <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 40, height: 40, background: "none", border: "none", color: "white", fontSize: 18, cursor: "pointer" }}>−</button>
          <span style={{ width: 32, textAlign: "center", color: "white", fontWeight: 600 }}>{qty}</span>
          <button onClick={() => setQty(q => Math.min(10, q + 1))} style={{ width: 40, height: 40, background: "none", border: "none", color: "white", fontSize: 18, cursor: "pointer" }}>+</button>
        </div>
        {variant && variant.quantity <= 5 && variant.quantity > 0 && (
          <span style={{ fontSize: 12, color: "#f87171" }}>Only {variant.quantity} left!</span>
        )}
        {variant && variant.quantity === 0 && (
          <span style={{ fontSize: 12, color: "#f87171" }}>Out of stock</span>
        )}
      </div>

      {/* Price */}
      <div className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900, fontSize: 36, marginBottom: 24 }}>
        ৳{Number(price).toLocaleString()}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button
          id="add-to-cart-main"
          onClick={handleAddToCart}
          disabled={loading || (variant?.quantity === 0)}
          style={{
            flex: 1, padding: "16px",
            background: "linear-gradient(135deg, #eab308, #ca8a04)",
            border: "none", borderRadius: 14, color: "white",
            fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16,
            cursor: loading || variant?.quantity === 0 ? "not-allowed" : "pointer",
            opacity: variant?.quantity === 0 ? 0.5 : 1,
          }}
        >
          {loading ? "Adding..." : "🛒 Add to Cart"}
        </button>
        <button
          id="add-to-wishlist-btn"
          onClick={handleWishlist}
          style={{
            width: 52, height: 52, borderRadius: 14,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171", fontSize: 22, cursor: "pointer",
          }}
        >❤️</button>
      </div>

      {msg && (
        <div style={{
          padding: "12px 16px", borderRadius: 12,
          background: msg.includes("❌") ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          border: msg.includes("❌") ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.3)",
          color: msg.includes("❌") ? "#f87171" : "#4ade80", fontSize: 14,
        }}>{msg}</div>
      )}
    </div>
  );
}

export function ReviewSection({ productId, reviews }: {
  productId: number;
  reviews: Product["reviews"];
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await submitReviewAction(productId, rating, comment);
    setMsg(result.error ?? (result.success ? "Review submitted!" : ""));
    setLoading(false);
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div>
      <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 24, color: "white", marginBottom: 8 }}>
        Reviews {reviews.length > 0 && <span className="gradient-text">({reviews.length})</span>}
      </h2>
      {reviews.length > 0 && (
        <div style={{ color: "#f59e0b", fontSize: 20, marginBottom: 24 }}>
          {"★".repeat(Math.floor(avgRating))} <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>{avgRating.toFixed(1)} average</span>
        </div>
      )}

      {/* Review List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
        {reviews.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>No reviews yet. Be the first!</p>
        )}
        {reviews.map((r) => (
          <div key={r.review_id} style={{
            background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#f59e0b" }}>{"★".repeat(r.rating)}</span>
                <span style={{ fontWeight: 600, color: "white", fontSize: 14 }}>{r.customer?.name ?? "Anonymous"}</span>
                {r.is_verified && (
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 100,
                    background: "rgba(34,197,94,0.1)", color: "#4ade80",
                    border: "1px solid rgba(34,197,94,0.2)",
                  }}>✓ Verified Purchase</span>
                )}
              </div>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            {r.comment && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7 }}>{r.comment}</p>}
          </div>
        ))}
      </div>

      {/* Write Review */}
      <div style={{
        background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: 24,
      }}>
        <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 20 }}>
          Write a Review
        </h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8, display: "block" }}>Your Rating</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} type="button" onClick={() => setRating(r)} style={{
                  width: 40, height: 40, borderRadius: 10, fontSize: 18, cursor: "pointer",
                  background: r <= rating ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)",
                  border: r <= rating ? "1px solid rgba(234,179,8,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  color: r <= rating ? "#eab308" : "rgba(255,255,255,0.3)",
                }}>★</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8, display: "block" }}>Comment (optional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              style={{
                width: "100%", padding: "12px 16px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 12, color: "white", fontSize: 14, resize: "vertical", outline: "none",
              }}
              placeholder="Share your experience..."
            />
          </div>
          <button id="submit-review-btn" type="submit" disabled={loading} style={{
            padding: "12px 28px", background: "linear-gradient(135deg, #eab308, #ca8a04)",
            border: "none", borderRadius: 12, color: "white",
            fontWeight: 700, fontSize: 14, cursor: "pointer", alignSelf: "flex-start",
          }}>
            {loading ? "Submitting..." : "Submit Review"}
          </button>
          {msg && <p style={{ fontSize: 13, color: msg.includes("error") ? "#f87171" : "#4ade80" }}>{msg}</p>}
        </form>
      </div>
    </div>
  );
}
