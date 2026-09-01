"use client";

import Link from "next/link";
import { Product } from "@prisma/client";

type ProductWithDetails = Product & {
  category: { name: string } | null;
  variants: {
    price_override: number | string | null;
    quantity: number;
    color: string | null;
  }[];
  _count: { reviews: number };
};

export default function ProductCard({ product }: { product: ProductWithDetails }) {
  const stock = product.variants.reduce((acc, v) => acc + v.quantity, 0);
  const isOutOfStock = stock === 0;

  // Find lowest price among variants, fallback to base_price
  const price = product.variants.length > 0 
    ? Math.min(...product.variants.map(v => Number(v.price_override ?? product.base_price)))
    : Number(product.base_price);

  return (
    <Link href={`/products/${product.product_id}`} style={{
      display: "flex", flexDirection: "column", textDecoration: "none",
      background: "rgba(22,22,31,0.6)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 20, overflow: "hidden", transition: "transform 0.2s ease, border-color 0.2s ease",
      cursor: "pointer"
    }} 
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.borderColor = "rgba(234,179,8,0.3)";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
    }}>
      <div style={{
        height: 240, position: "relative",
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80
      }}>
        {/* Placeholder Icon based on category */}
        {product.category?.name?.toLowerCase().includes("laptop") ? "💻" : 
         product.category?.name?.toLowerCase().includes("phone") ? "📱" :
         product.category?.name?.toLowerCase().includes("audio") ? "🎧" : "🛍️"}
        
        {isOutOfStock && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(239,68,68,0.9)", color: "white",
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
            backdropFilter: "blur(4px)"
          }}>
            OUT OF STOCK
          </div>
        )}
      </div>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: "#eab308", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {product.category?.name || "Uncategorized"}
          </div>
          {product._count.reviews > 0 && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#eab308" }}>★</span> {product._count.reviews}
            </div>
          )}
        </div>
        
        <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 8, lineHeight: 1.3 }}>
          {product.name}
        </h3>
        
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16 }}>
          <div className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 22 }}>
            ৳{price.toLocaleString()}
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#eab308", fontSize: 18
          }}>+</div>
        </div>
      </div>
    </Link>
  );
}
