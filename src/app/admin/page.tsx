import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import OrderStatusBadge from "@/components/OrderStatusBadge";

export const metadata: Metadata = { title: "Admin Dashboard — NodeCommerce" };

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalOrders, pendingOrders, totalRevenue, totalCustomers,
    lowStockVariants, recentOrders,
  ] = await Promise.all([
    prisma.customerOrder.count(),
    prisma.customerOrder.count({ where: { status: "pending" } }),
    prisma.customerOrder.aggregate({
      _sum: { total_amount: true },
      where: { status: { in: ["delivered", "shipped", "processing", "confirmed"] } },
    }),
    prisma.customer.count(),
    prisma.productVariant.count({ where: { quantity: { lte: 5, gt: 0 } } }),
    prisma.customerOrder.findMany({
      orderBy: { order_date: "desc" },
      take: 8,
      include: {
        customer: { select: { name: true } },
        items: { select: { order_item_id: true } },
      },
    }),
  ]);

  const stats = [
    { label: "Total Orders", value: totalOrders, icon: "📦", color: "#eab308", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)" },
    { label: "Pending Orders", value: pendingOrders, icon: "⏳", color: "#60a5fa", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" },
    { label: "Total Revenue", value: `৳${Number(totalRevenue._sum.total_amount ?? 0).toLocaleString()}`, icon: "💰", color: "#4ade80", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)" },
    { label: "Total Customers", value: totalCustomers, icon: "👥", color: "#c084fc", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)" },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 4 }}>
        Dashboard
      </h1>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 32 }}>
        {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{
            background: stat.bg, border: `1px solid ${stat.border}`,
            borderRadius: 20, padding: "24px 20px",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{stat.icon}</div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockVariants > 0 && (
        <div style={{
          background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)",
          borderRadius: 16, padding: "14px 20px", marginBottom: 28,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div>
            <span style={{ color: "#eab308", fontWeight: 600 }}>{lowStockVariants} product variants</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}> are running low on stock (≤ 5 units)</span>
          </div>
          <Link href="/admin/products" style={{ marginLeft: "auto", color: "#eab308", fontSize: 13, textDecoration: "none" }}>
            Manage Inventory →
          </Link>
        </div>
      )}

      {/* Recent Orders Table */}
      <div style={{
        background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20, overflow: "hidden",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18 }}>
            Recent Orders
          </h2>
          <Link href="/admin/orders" style={{ color: "#eab308", fontSize: 13, textDecoration: "none" }}>View All →</Link>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              {["Order ID", "Customer", "Items", "Total", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order, i) => (
              <tr key={order.order_id} style={{ borderBottom: i < recentOrders.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ fontFamily: "monospace", color: "#eab308", fontWeight: 700 }}>#{order.order_id}</span>
                </td>
                <td style={{ padding: "14px 20px", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                  {order.customer.name}
                </td>
                <td style={{ padding: "14px 20px", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                  {order.items.length}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
                    ৳{Number(order.total_amount).toLocaleString()}
                  </span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <OrderStatusBadge status={order.status} />
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <Link href={`/admin/orders/${order.order_id}`} style={{
                    fontSize: 13, color: "#eab308", textDecoration: "none",
                    padding: "5px 12px", borderRadius: 8,
                    background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)",
                  }}>Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
