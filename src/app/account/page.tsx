import { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OrderStatusBadge from "@/components/OrderStatusBadge";

export const metadata: Metadata = { title: "My Account — NodeCommerce" };

export default async function AccountPage() {
  const session = await requireCustomer();

  const [orders, wallet, wishlistCount, notificationsCount] = await Promise.all([
    prisma.customerOrder.findMany({
      where: { customer_id: session.id },
      orderBy: { order_date: "desc" },
      take: 5,
      include: { items: { select: { order_item_id: true } } },
    }),
    prisma.wallet.findUnique({ where: { customer_id: session.id } }),
    prisma.wishlistItem.count({
      where: { wishlist: { customer_id: session.id } },
    }),
    prisma.notification.count({
      where: { customer_id: session.id, is_read: false },
    }),
  ]);

  const stats = [
    { label: "Total Orders", value: orders.length + (orders.length === 5 ? "+" : ""), icon: "📦" },
    { label: "Wallet Balance", value: `৳${Number(wallet?.balance ?? 0).toLocaleString()}`, icon: "💰" },
    { label: "Wishlist Items", value: wishlistCount, icon: "❤️" },
    { label: "Notifications", value: notificationsCount, icon: "🔔" },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 8 }}>
        Welcome back, {session.name.split(" ")[0]}! 👋
      </h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, marginBottom: 32 }}>
        Here&apos;s what&apos;s happening with your account.
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{
            background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 20,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 24, color: "white" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{
        background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20, padding: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18 }}>
            Recent Orders
          </h2>
          <Link href="/account/orders" style={{ color: "#eab308", fontSize: 13, textDecoration: "none" }}>
            View All →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 15 }}>No orders yet</p>
            <Link href="/products" style={{ color: "#eab308", fontSize: 14, textDecoration: "none", marginTop: 8, display: "block" }}>
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orders.map((order) => (
              <Link key={order.order_id} href={`/account/orders/${order.order_id}`} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                textDecoration: "none", transition: "all 0.2s ease",
              }}>
                <div>
                  <span style={{ fontFamily: "monospace", color: "#eab308", fontWeight: 700 }}>#{order.order_id}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginLeft: 12 }}>
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
                    ৳{Number(order.total_amount).toLocaleString()}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
