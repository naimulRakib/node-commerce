import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AddToCartSection, ReviewSection } from "./ProductClientComponents";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { product_id: Number(id) },
    select: { name: true, description: true },
  });
  return {
    title: product ? `${product.name} — NodeCommerce` : "Product — NodeCommerce",
    description: product?.description ?? undefined,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { product_id: Number(id), is_active: true },
    include: {
      category: true,
      variants: { orderBy: { created_at: "asc" } },
      reviews: {
        include: { customer: { select: { name: true } } },
        orderBy: { created_at: "desc" },
        take: 20,
      },
    },
  });

  if (!product) notFound();

  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  // Map product for client components (convert Decimal to number)
  const productForClient = {
    product_id: product.product_id,
    name: product.name,
    description: product.description,
    base_price: Number(product.base_price),
    category: product.category,
    variants: product.variants.map(v => ({
      variant_code: v.variant_code,
      color: v.color,
      size: v.size,
      price_override: v.price_override ? Number(v.price_override) : null,
      quantity: v.quantity,
      sku: v.sku,
    })),
    reviews: product.reviews.map(r => ({
      review_id: r.review_id,
      rating: r.rating,
      comment: r.comment,
      is_verified: r.is_verified,
      created_at: r.created_at.toISOString(),
      customer: r.customer,
    })),
  };

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "100vh" }}>
        {/* Breadcrumb */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 0" }}>
          <div className="container" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textDecoration: "none" }}>Home</Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
            <Link href="/products" style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textDecoration: "none" }}>Products</Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{product.name}</span>
          </div>
        </div>

        <div className="container" style={{ padding: "40px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, marginBottom: 60 }}>
            {/* Left: Product Image */}
            <div>
              <div style={{
                background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                borderRadius: 24, height: 420,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 160, border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}>
                {getCategoryEmoji(product.category?.name)}
              </div>

              {/* Specs */}
              <div style={{
                marginTop: 24, background: "rgba(22,22,31,0.8)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16, padding: 20,
              }}>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 15, marginBottom: 12 }}>
                  Product Details
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Product Code</span>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "monospace" }}>{product.product_code}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Category</span>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{product.category?.name ?? "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Variants</span>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{product.variants.length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Rating</span>
                    <span style={{ color: "#f59e0b", fontSize: 13 }}>
                      {avgRating > 0 ? `${avgRating.toFixed(1)} ★ (${product.reviews.length} reviews)` : "No reviews yet"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Product Info */}
            <div>
              {product.category && (
                <div className="badge badge-orange" style={{ marginBottom: 16, display: "inline-flex" }}>
                  {product.category.name}
                </div>
              )}
              <h1 style={{
                fontFamily: "Outfit, sans-serif", fontWeight: 800,
                fontSize: 32, color: "white", marginBottom: 12, lineHeight: 1.2,
              }}>
                {product.name}
              </h1>

              {avgRating > 0 && (
                <div style={{ color: "#f59e0b", fontSize: 18, marginBottom: 20 }}>
                  {"★".repeat(Math.floor(avgRating))}
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginLeft: 8 }}>
                    {avgRating.toFixed(1)} ({product.reviews.length} reviews)
                  </span>
                </div>
              )}

              {product.description && (
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>
                  {product.description}
                </p>
              )}

              {/* Delivery + Return perks */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                {[
                  { icon: "🚀", text: "Free delivery on orders above ৳999" },
                  { icon: "↩️", text: "Easy 30-day return policy" },
                  { icon: "🔒", text: "100% secure payment" },
                ].map((perk, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                    <span style={{ fontSize: 16 }}>{perk.icon}</span> {perk.text}
                  </div>
                ))}
              </div>

              <AddToCartSection product={productForClient} />
            </div>
          </div>

          {/* Reviews Section */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 48 }}>
            <ReviewSection productId={product.product_id} reviews={productForClient.reviews} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function getCategoryEmoji(name?: string | null): string {
  const map: Record<string, string> = {
    "Electronics": "📱", "Fashion": "👔", "Home & Living": "🏠",
    "Footwear": "👟", "Beauty": "💄", "Gaming": "🎮",
    "Kitchen": "🍳", "Sports": "🏋️", "Phones": "📱", "Laptops": "💻",
  };
  return map[name ?? ""] ?? "🛍️";
}
