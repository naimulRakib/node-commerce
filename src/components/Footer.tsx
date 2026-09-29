import Link from "next/link";

// ─── ফুটার কম্পোনেন্ট (Footer Component) ───────────────────────────────────────────
// এটি একটি স্ট্যাটিক সার্ভার কম্পোনেন্ট (Server Component), যা পেজের নিচের অংশে দেখানো হয়।
export default function Footer() {
  // ফুটারের বিভিন্ন লিংকগুলোর তালিকা (Static Data)।
  const shopLinks = ["All Products", "New Arrivals", "Best Sellers", "Flash Deals"];
  const supportLinks = ["Help Center", "Track Order", "Return Policy", "Contact Us"];
  const companyLinks = ["About Us", "Privacy Policy", "Terms of Service"];

  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      paddingTop: 60, paddingBottom: 32,
    }}>
      <div className="container">
        {/* CSS Grid ব্যবহার করে ৪টি কলামে লেআউট তৈরি করা হয়েছে। */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          
          {/* 1. ব্র্যান্ড আইডেন্টিটি (Brand Section) */}
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
            {/* সোশ্যাল মিডিয়া আইকন */}
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

          {/* 2. লিংকসমূহ (Links Section) */}
          {[
            { title: "Shop", links: shopLinks },
            { title: "Support", links: supportLinks },
            { title: "Company", links: companyLinks },
          ].map((col) => (
            <div key={col.title}>
              {/* কলাম টাইটেল */}
              <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 15, color: "white", marginBottom: 20 }}>
                {col.title}
              </div>
              {/* লিংকের তালিকা */}
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

        {/* 3. ডিভাইডার (Divider) */}
        <div className="divider" style={{ marginBottom: 24 }} />

        {/* 4. কপিরাইট এবং পেমেন্ট মেথড (Copyright & Payments) */}
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

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/components/Footer.tsx`) ওয়েবসাইটের গ্লোবাল ফুটার (Global Footer) তৈরি করে। এটি একটি "Server Component" হওয়ায় ব্রাউজারে এর কোনো জাভাস্ক্রিপ্ট বান্ডেল পাঠানো হয় না, যা পেজ লোড টাইম (Page Load Time) কমিয়ে আনে।

২. ইউআই লেআউট ও ডিজাইন (UI Layout & Design):
এখানে CSS Flexbox এবং Grid এর মাধ্যমে রেস্পন্সিভ (Responsive) লেআউট তৈরি করা হয়েছে। ইনলাইন স্টাইল (Inline Styles) ব্যবহার করে ডার্ক থিমের (Dark Theme) কালার প্যালেট, ট্রান্সপারেন্ট বর্ডার এবং গ্রেডিয়েন্ট (Gradient) টেক্সট প্রয়োগ করা হয়েছে। এটি নেক্সট.জেএস-এর `Link` কম্পোনেন্ট ব্যবহার করে, যা ফাস্ট ক্লায়েন্ট-সাইড নেভিগেশন (Client-side Navigation) নিশ্চিত করে।
================================================================================
*/
