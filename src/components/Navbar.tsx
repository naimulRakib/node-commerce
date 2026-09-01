import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/actions/auth";

async function getCartCount(customerId: number): Promise<number> {
  const cart = await prisma.cart.findUnique({
    where: { customer_id: customerId },
    include: { _count: { select: { items: true } } },
  });
  return cart?._count.items ?? 0;
}

export default async function Navbar() {
  const session = await getSession();
  const cartCount = session?.role === "customer" ? await getCartCount(session.id) : 0;
  const isAdmin = session && ["admin", "super_admin"].includes(session.role);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(10,10,15,0.95)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "14px 0",
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* Logo */}
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

        {/* Nav Links */}
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

        {/* Search */}
        <div style={{ flex: 1, position: "relative" }}>
          <Link href="/products">
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              readOnly
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 50, padding: "10px 20px 10px 44px",
                color: "white", fontSize: 14, outline: "none", cursor: "pointer",
              }}
            />
          </Link>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
        </div>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {session?.role === "customer" && (
            <>
              <Link href="/account/wishlist" id="nav-wishlist-btn" style={{
                width: 42, height: 42, borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "white", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                textDecoration: "none",
              }}>🤍</Link>

              <Link href="/cart" id="nav-cart-btn" style={{
                position: "relative", display: "flex", alignItems: "center", gap: 8,
                padding: "10px 20px",
                background: "linear-gradient(135deg, #eab308, #ca8a04)",
                border: "none", borderRadius: 12, color: "white",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                textDecoration: "none",
              }}>
                🛒 Cart
                {cartCount > 0 && (
                  <span style={{
                    minWidth: 22, height: 22,
                    background: "white", color: "#eab308",
                    borderRadius: 50, fontSize: 11, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{cartCount}</span>
                )}
              </Link>

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
