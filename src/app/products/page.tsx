import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "All Products — NodeCommerce",
  description: "Browse thousands of premium products at unbeatable prices.",
};

const PAGE_SIZE = 12;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const categoryId = params.category ? Number(params.category) : undefined;
  const sort = params.sort ?? "newest";
  const page = Number(params.page ?? 1);
  const q = params.q ?? "";

  const orderBy =
    sort === "price_asc"  ? { base_price: "asc" as const } :
    sort === "price_desc" ? { base_price: "desc" as const } :
                            { created_at: "desc" as const };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        is_active: true,
        category_id: categoryId,
        OR: q ? [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] : undefined,
      },
      include: {
        category: true,
        variants: { take: 1, orderBy: { created_at: "asc" } },
        reviews: { select: { rating: true } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({
      where: {
        is_active: true,
        category_id: categoryId,
        OR: q ? [{ name: { contains: q, mode: "insensitive" } }] : undefined,
      },
    }),
    prisma.category.findMany({ where: { parent_category_id: null }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "100vh" }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(180deg, rgba(234,179,8,0.05) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "40px 0 32px",
        }}>
          <div className="container">
            <h1 style={{
              fontFamily: "Outfit, sans-serif", fontWeight: 800,
              fontSize: 36, color: "white", marginBottom: 8,
            }}>
              {q ? `Search: "${q}"` : "All Products"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>
              {total} product{total !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: "32px 24px", display: "flex", gap: 32 }}>
          {/* Sidebar */}
          <aside style={{ width: 220, flexShrink: 0 }}>
            <div style={{
              background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16, padding: 20,
            }}>
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 15, marginBottom: 16 }}>
                Categories
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Link href="/products" style={{
                  padding: "9px 12px", borderRadius: 10, fontSize: 14,
                  color: !categoryId ? "#eab308" : "rgba(255,255,255,0.55)",
                  background: !categoryId ? "rgba(234,179,8,0.1)" : "transparent",
                  textDecoration: "none", fontWeight: !categoryId ? 600 : 400,
                  border: !categoryId ? "1px solid rgba(234,179,8,0.2)" : "1px solid transparent",
                }}>All Categories</Link>
                {categories.map((cat) => (
                  <Link key={cat.category_id} href={`/products?category=${cat.category_id}`} style={{
                    padding: "9px 12px", borderRadius: 10, fontSize: 14,
                    color: categoryId === cat.category_id ? "#eab308" : "rgba(255,255,255,0.55)",
                    background: categoryId === cat.category_id ? "rgba(234,179,8,0.1)" : "transparent",
                    textDecoration: "none", fontWeight: categoryId === cat.category_id ? 600 : 400,
                    border: categoryId === cat.category_id ? "1px solid rgba(234,179,8,0.2)" : "1px solid transparent",
                  }}>
                    {cat.name}
                  </Link>
                ))}
              </div>

              <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 15, marginTop: 24, marginBottom: 12 }}>
                Sort By
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  { value: "newest", label: "Newest First" },
                  { value: "price_asc", label: "Price: Low to High" },
                  { value: "price_desc", label: "Price: High to Low" },
                ].map((s) => (
                  <Link key={s.value} href={`/products?${new URLSearchParams({ ...(categoryId ? { category: String(categoryId) } : {}), sort: s.value })}`} style={{
                    padding: "9px 12px", borderRadius: 10, fontSize: 14,
                    color: sort === s.value ? "#eab308" : "rgba(255,255,255,0.55)",
                    background: sort === s.value ? "rgba(234,179,8,0.1)" : "transparent",
                    textDecoration: "none", fontWeight: sort === s.value ? 600 : 400,
                    border: sort === s.value ? "1px solid rgba(234,179,8,0.2)" : "1px solid transparent",
                  }}>{s.label}</Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div style={{ flex: 1 }}>
            {products.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: 80 }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🔍</div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }}>No products found</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {products.map((product) => {
                  const avgRating = product.reviews.length > 0
                    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
                    : 0;
                  const variant = product.variants[0];
                  const price = variant?.price_override ?? product.base_price;

                  return (
                    <Link key={product.product_id} href={`/products/${product.product_id}`} style={{ textDecoration: "none" }}>
                      <div className="product-card" style={{ padding: 0 }}>
                        {/* Image area */}
                        <div style={{
                          height: 180,
                          background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 70, borderRadius: "20px 20px 0 0",
                        }}>
                          {getCategoryEmoji(product.category?.name)}
                        </div>

                        <div style={{ padding: "16px 18px 20px" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>
                            {product.category?.name}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "white", marginBottom: 8, lineHeight: 1.4 }}>
                            {product.name}
                          </div>
                          {avgRating > 0 && (
                            <div style={{ fontSize: 12, color: "#f59e0b", marginBottom: 8 }}>
                              {"★".repeat(Math.floor(avgRating))} ({product.reviews.length})
                            </div>
                          )}
                          <div className="gradient-text" style={{
                            fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 20,
                          }}>
                            ৳{Number(price).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={`/products?${new URLSearchParams({ ...(categoryId ? { category: String(categoryId) } : {}), page: String(p) })}`} style={{
                    width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none",
                    background: p === page ? "linear-gradient(135deg, #eab308, #ca8a04)" : "rgba(255,255,255,0.04)",
                    border: p === page ? "none" : "1px solid rgba(255,255,255,0.08)",
                    color: p === page ? "white" : "rgba(255,255,255,0.5)",
                  }}>{p}</Link>
                ))}
              </div>
            )}
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
