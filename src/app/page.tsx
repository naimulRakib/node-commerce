import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "NodeCommerce — High-Performance B2C Shopping",
  description: "Experience the ultimate shopping platform.",
};

export default async function HomePage() {
  const [categories, newProducts] = await Promise.all([
    prisma.category.findMany({ take: 6 }),
    prisma.product.findMany({
      where: { is_active: true },
      orderBy: { created_at: "desc" },
      take: 4,
      include: {
        category: true,
        variants: { select: { color: true, size: true, sku: true, price_override: true, quantity: true } },
        _count: { select: { reviews: true } }
      }
    }),
  ]);

  const serializedNewProducts = newProducts.map(p => ({
    ...p,
    base_price: p.base_price.toString(),
    variants: p.variants.map(v => ({
      ...v,
      price_override: v.price_override ? v.price_override.toString() : null,
    }))
  }));

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 60, minHeight: "100vh" }}>
        
        {/* Hero Section */}
        <section style={{ 
          position: "relative", padding: "120px 24px 80px", 
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          overflow: "hidden" 
        }}>
          {/* Background Effects */}
          <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 800, height: 800, background: "radial-gradient(circle, rgba(234,179,8,0.1) 0%, transparent 70%)", zIndex: -1 }} />
          
          <div style={{ padding: "8px 16px", borderRadius: 50, background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", color: "#eab308", fontSize: 13, fontWeight: 600, marginBottom: 24, letterSpacing: 1 }}>
            🎉 NEW COLLECTION 2026
          </div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900, fontSize: "clamp(48px, 8vw, 72px)", color: "white", lineHeight: 1.1, marginBottom: 24, maxWidth: 900 }}>
            Elevate Your <span className="gradient-text">Lifestyle</span> with NodeCommerce.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, maxWidth: 600, marginBottom: 40, lineHeight: 1.6 }}>
            Discover our curated collection of premium products. Built with robust architecture, guaranteeing ACID-compliant seamless transactions.
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <Link href="/products" style={{ 
              padding: "16px 32px", background: "linear-gradient(135deg, #eab308, #ca8a04)", 
              border: "none", borderRadius: 14, color: "white", fontFamily: "Outfit, sans-serif", 
              fontWeight: 700, fontSize: 16, textDecoration: "none",
              boxShadow: "0 10px 30px rgba(234,179,8,0.3)" 
            }}>
              Shop Now
            </Link>
            <Link href="/login" style={{ 
              padding: "16px 32px", background: "rgba(255,255,255,0.05)", 
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: "white", 
              fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16, textDecoration: "none",
            }}>
              Create Account
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section className="container" style={{ padding: "60px 24px" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 32, color: "white", marginBottom: 32, textAlign: "center" }}>
            Shop by Category
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            {categories.map((c, i) => (
              <Link key={c.category_id} href={`/products?category=${c.category_id}`} style={{
                padding: "32px 20px", background: "rgba(22,22,31,0.6)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20, textAlign: "center", textDecoration: "none", transition: "all 0.3s ease",
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{["📱", "💻", "🎧", "⌚", "👟", "👕"][i % 6]}</div>
                <div style={{ color: "white", fontWeight: 600, fontSize: 15 }}>{c.name}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* New Arrivals */}
        <section className="container" style={{ padding: "60px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <div>
              <div style={{ color: "#eab308", fontWeight: 700, fontSize: 13, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Just Dropped</div>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 32, color: "white" }}>New Arrivals</h2>
            </div>
            <Link href="/products" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
              View All →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {serializedNewProducts.map((p: any) => <ProductCard key={p.product_id} product={p} />)}
          </div>
        </section>

        {/* Features Banner */}
        <section style={{ background: "rgba(22,22,31,0.8)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "80px 24px", marginTop: 40 }}>
          <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40, textAlign: "center" }}>
            {[
              { i: "🚀", t: "Fast Delivery", d: "Get your products delivered quickly with our premium couriers." },
              { i: "🔒", t: "Secure Checkout", d: "100% ACID compliant secure transactions protecting your data." },
              { i: "🛡️", t: "Quality Guarantee", d: "30-day money-back guarantee on all our products." },
            ].map(f => (
              <div key={f.t}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>{f.i}</div>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 20, marginBottom: 10 }}>{f.t}</h3>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, lineHeight: 1.6 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </section>
        
      </main>
      <Footer />
    </>
  );
}
