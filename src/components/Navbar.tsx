import Link from "next/link";
// কুকি থেকে সেশন (Session) রিড (Read) করার ফাংশন।
import { getSession } from "@/lib/auth";
// ডাটাবেস কোয়েরি করার জন্য অবজেক্ট।
import { db } from "@/lib/db";
// লগ-আউট করার সার্ভার অ্যাকশন।
import { logoutAction } from "@/actions/auth";

// ─── ডাটাবেস কোয়েরি (Database Query) ──────────────────────────────────────────
// ইউজারের কার্টে কয়টি আইটেম আছে তা বের করার জন্য এই ফাংশন।
async function getCartCount(customerId: number): Promise<number> {
  // প্রথমে ইউজারের কার্ট আইডি বের করা।
  const cartRes = await db.query('SELECT cart_id FROM cart WHERE customer_id = $1', [customerId]);
  if (cartRes.rows.length === 0) return 0; // কার্ট না থাকলে ০।
  
  // তারপর সেই কার্টের আইটেম গণনা (COUNT) করা।
  const countRes = await db.query('SELECT COUNT(*) FROM cart_item WHERE cart_id = $1', [cartRes.rows[0].cart_id]);
  return Number(countRes.rows[0].count);
}

// ─── নেভিগেশন বার (Navbar Component) ──────────────────────────────────────────
// এটি একটি সার্ভার কম্পোনেন্ট, যা রিকোয়েস্টের সময় সার্ভারেই ডেটা ফেচ করে রেন্ডার হয়।
export default async function Navbar() {
  // ১. সেশন ডেটা ফেচিং (Session Data Fetching): কুকি থেকে বর্তমান ইউজারের তথ্য নেওয়া।
  const session = await getSession();

  // ২. কার্ট কাউন্ট ফেচিং (Cart Count Fetching): ইউজার লগ-ইন করা থাকলে ডাটাবেস থেকে সংখ্যা নেওয়া।
  const cartCount = session?.role === "customer" ? await getCartCount(session.id) : 0;
  
  // ৩. অ্যাডমিন চেক (Admin Check): ইউজারের রোল কি অ্যাডমিন বা সুপার অ্যাডমিন কি না।
  const isAdmin = session && ["admin", "super_admin"].includes(session.role);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(10,10,15,0.95)",
      backdropFilter: "blur(20px)", // Glassmorphism ইফেক্ট
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "14px 0",
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 24 }}>
        
        {/* 1. লোগো (Logo) */}
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38,
              background: "linear-gradient(135deg, #eab308, #ca8a04)",
              borderRadius: 12, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 20, fontWeight: 900, color: "white",
              boxShadow: "0 4px 15px rgba(234,179,8,0.4)",
            }}>N</div>
            <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 22, color: "white" }}>
              Node<span className="gradient-text">Commerce</span>
            </span>
          </div>
        </Link>

        {/* 2. মেনু লিংক (Nav Links) */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { href: "/", label: "Home" },
            { href: "/products", label: "Products" },
            { href: "/products?deal=flash", label: "Deals" },
          ].map((item) => (
            <Link key={item.label} href={item.href} style={{
              color: "rgba(255,255,255,0.7)", textDecoration: "none",
              fontSize: 14, fontWeight: 500, padding: "8px 16px", borderRadius: 10,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={undefined}
            >
              {item.label}
            </Link>
          ))}
          {/* অ্যাডমিন হলে অতিরিক্ত লিংক দেখানো হবে */}
          {isAdmin && (
            <Link href="/admin" style={{
              color: "#c084fc", textDecoration: "none",
              fontSize: 14, fontWeight: 500, padding: "8px 16px", borderRadius: 10,
              background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)",
            }}>
              ⚙️ Admin
            </Link>
          )}
        </div>

        {/* 3. সার্চ বার (Search Bar) */}
        <div style={{ flex: 1, position: "relative" }}>
          <form action="/products" method="GET">
            <input
              type="text"
              name="q"
              placeholder="Search products, brands, categories..."
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 50, padding: "10px 20px 10px 44px",
                color: "white", fontSize: 14, outline: "none",
              }}
            />
            <button type="submit" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </form>
        </div>

        {/* 4. ডান দিকের অ্যাকশন প্যানেল (Right Actions) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          
          {/* যদি ইউজার লগ-ইন করা কাস্টমার হয় */}
          {session?.role === "customer" && (
            <>
              {/* উইশলিস্ট বাটন */}
              <Link href="/account/wishlist" id="nav-wishlist-btn" style={{
                width: 42, height: 42, borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "white", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                textDecoration: "none",
              }}>🤍</Link>

              {/* কার্ট বাটন (ব্যাজ সহ) */}
              <Link href="/cart" id="nav-cart-btn" style={{
                position: "relative", display: "flex", alignItems: "center", gap: 8,
                padding: "10px 20px",
                background: "linear-gradient(135deg, #eab308, #ca8a04)",
                border: "none", borderRadius: 12, color: "white",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                textDecoration: "none",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg> Cart
                {cartCount > 0 && (
                  <span style={{
                    minWidth: 22, height: 22,
                    background: "white", color: "#eab308",
                    borderRadius: 50, fontSize: 11, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{cartCount}</span>
                )}
              </Link>

              {/* প্রোফাইল বাটন */}
              <Link href="/account" style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, textDecoration: "none",
                color: "rgba(255,255,255,0.8)", fontSize: 14,
              }}>
                👤 {session.name.split(" ")[0]}
              </Link>
            </>
          )}

          {/* যদি ইউজার লগ-ইন না থাকে */}
          {!session && (
            <>
              <Link href="/login" id="nav-login-btn" style={{
                padding: "10px 18px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, color: "rgba(255,255,255,0.8)",
                fontSize: 14, fontWeight: 500, textDecoration: "none",
              }}>Sign In</Link>
              <Link href="/register" style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #eab308, #ca8a04)",
                borderRadius: 12, color: "white",
                fontSize: 14, fontWeight: 600, textDecoration: "none",
              }}>Register</Link>
            </>
          )}

          {/* যদি যেকোনো রোল (অ্যাডমিন বা কাস্টমার) লগ-ইন থাকে, লগ-আউট বাটন দেখাও */}
          {session && (
            <form action={logoutAction}>
              <button type="submit" style={{
                padding: "10px 16px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 12, color: "rgba(239,68,68,0.8)",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>Logout</button>
            </form>
          )}
        </div>
      </div>
    </nav>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/components/Navbar.tsx`) ওয়েবসাইটের প্রধান নেভিগেশন বার তৈরি করে। এটি একটি "Server Component", যার মানে হলো এটি সার্ভার-সাইডে এক্সিকিউট হয়। এটি ডাটাবেস থেকে সরাসরি ডেটা ফেচ (Fetch) করতে পারে, যেমন: `getSession` এর মাধ্যমে বর্তমান ইউজারের সেশন জানা এবং `getCartCount` এর মাধ্যমে কার্টের আইটেম সংখ্যা বের করা।

২. সার্ভার-সাইড রেন্ডারিং (Server-Side Rendering / SSR):
রিয়্যাক্ট (React) অ্যাপ্লিকেশনে সাধারণত ক্লায়েন্ট-সাইডে এপিআই কল করে কার্ট কাউন্ট (Cart Count) বা সেশন চেক করতে হয়, যা 'ওয়াটারফল (Waterfall)' সমস্যার সৃষ্টি করে। নেক্সট.জেএস-এ এই কম্পোনেন্টটি সার্ভারেই ডাটাবেস থেকে কাউন্ট বের করে সম্পূর্ণ HTML জেনারেট করে ব্রাউজারে পাঠায়। এটি জিরো-জাভাস্ক্রিপ্ট (Zero-JS) বা ফাস্ট ইনিশিয়াল লোড (Fast Initial Load) নিশ্চিত করে।

৩. ডাইনামিক ইউআই রেন্ডারিং (Dynamic UI Rendering):
`session` এবং `session.role` ভেরিয়েবলের উপর ভিত্তি করে UI কন্ডিশনালি রেন্ডার করা হয়। যদি ইউজার অ্যাডমিন হয়, তবে সে অ্যাডমিন ড্যাশবোর্ডের লিংক দেখবে; যদি কাস্টমার হয়, তবে উইশলিস্ট ও কার্ট দেখবে; আর যদি লগ-ইন না থাকে, তবে লগ-ইন/রেজিস্ট্রেশন বাটন দেখবে।
================================================================================
*/
