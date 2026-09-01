import Link from "next/link";

export default function Footer() {
  const shopLinks = ["All Products", "New Arrivals", "Best Sellers", "Flash Deals"];
  const supportLinks = ["Help Center", "Track Order", "Return Policy", "Contact Us"];
  const companyLinks = ["About Us", "Privacy Policy", "Terms of Service"];

  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      paddingTop: 60, paddingBottom: 32,
    }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36,
                background: "linear-gradient(135deg, #eab308, #ca8a04)",
                borderRadius: 10, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 18, fontWeight: 900, color: "white",
              }}>N</div>
              <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 20, color: "white" }}>
                Node<span className="gradient-text">Commerce</span>
              </span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
              Your one-stop destination for premium products at unbeatable prices. Fast delivery, easy returns, and a curated selection of the best brands.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {["📘", "📸", "🐦", "▶️"].map((icon, i) => (
                <div key={i} style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, cursor: "pointer",
                }}>{icon}</div>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: "Shop", links: shopLinks },
            { title: "Support", links: supportLinks },
            { title: "Company", links: companyLinks },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 15, color: "white", marginBottom: 20 }}>
                {col.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {col.links.map((link) => (
                  <Link key={link} href="#" style={{
                    color: "rgba(255,255,255,0.35)", fontSize: 14, textDecoration: "none",
                  }}>{link}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="divider" style={{ marginBottom: 24 }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
            © 2026 NodeCommerce. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {["💳 Visa/Card", "📱 bKash/Nagad", "🏦 Bank Transfer"].map((label, i) => (
              <div key={i} style={{
                padding: "4px 12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,0.4)",
              }}>{label}</div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
