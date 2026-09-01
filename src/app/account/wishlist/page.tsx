import { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "My Wishlist — NodeCommerce" };

export default async function WishlistPage() {
  const session = await requireCustomer();

  const wishlist = await prisma.wishlist.findUnique({
    where: { customer_id: session.id },
    include: {
      items: {
        include: {
          product: { include: { category: true } },
          variant: { select: { color: true, size: true, price_override: true } },
        },
        orderBy: { added_at: "desc" },
      },
    },
  });

  const items = wishlist?.items ?? [];

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 28 }}>
        My Wishlist <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>({items.length})</span>
      </h1>

      {items.length === 0 ? (
        <div style={{ background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>❤️</div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, marginBottom: 20 }}>Your wishlist is empty</p>
          <Link href="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {items.map((item) => {
            const price = item.variant?.price_override ?? item.product.base_price;
            return (
              <div key={item.id} style={{ background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
                <div style={{ height: 140, background: "linear-gradient(135deg, #1a1a2e, #16213e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🛍️</div>
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>{item.product.category?.name}</div>
                  <div style={{ fontWeight: 600, color: "white", fontSize: 14, marginBottom: 8 }}>{item.product.name}</div>
                  {item.variant && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
                      {item.variant.color}{item.variant.size ? ` • ${item.variant.size}` : ""}
                    </div>
                  )}
                  <div className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
                    ৳{Number(price).toLocaleString()}
                  </div>
                  <Link href={`/products/${item.product.product_id}`} style={{
                    display: "block", textAlign: "center", padding: "10px",
                    background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)",
                    borderRadius: 10, color: "#eab308", fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}>View Product</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
