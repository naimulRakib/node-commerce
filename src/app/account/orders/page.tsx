import { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OrderStatusBadge from "@/components/OrderStatusBadge";

export const metadata: Metadata = { title: "My Orders — NodeCommerce" };

export default async function OrdersPage() {
  const session = await requireCustomer();

  const orders = await prisma.customerOrder.findMany({
    where: { customer_id: session.id },
    orderBy: { order_date: "desc" },
    include: {
      items: {
        include: { product: { select: { name: true } } },
        take: 3,
      },
      courier: { select: { name: true } },
    },
  });

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 28 }}>
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div style={{
          background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20, padding: "60px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>📦</div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, marginBottom: 20 }}>No orders yet</p>
          <Link href="/products" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {orders.map((order) => (
            <div key={order.order_id} style={{
              background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20, overflow: "hidden",
            }}>
              {/* Order Header */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.01)",
              }}>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Order ID</span>
                    <div style={{ fontFamily: "monospace", color: "#eab308", fontWeight: 700, fontSize: 15 }}>
                      #{order.order_id}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Placed On</span>
                    <div style={{ color: "white", fontSize: 14 }}>
                      {new Date(order.order_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  {order.courier && (
                    <div>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Courier</span>
                      <div style={{ color: "white", fontSize: 14 }}>{order.courier.name}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <OrderStatusBadge status={order.status} />
                  <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 18 }}>
                    ৳{Number(order.total_amount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div style={{ padding: "16px 24px" }}>
                {order.items.map((item) => (
                  <div key={item.order_item_id} style={{
                    color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 4,
                  }}>
                    • {item.product.name} × {item.quantity}
                  </div>
                ))}
                {order.items.length === 3 && (
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontStyle: "italic" }}>
                    + more items...
                  </div>
                )}
              </div>

              <div style={{ padding: "0 24px 16px", display: "flex", gap: 12 }}>
                <Link href={`/account/orders/${order.order_id}`} style={{
                  padding: "9px 20px", borderRadius: 10,
                  background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)",
                  color: "#eab308", fontSize: 13, fontWeight: 600, textDecoration: "none",
                }}>
                  View Details →
                </Link>
                {order.status === "pending" && (
                  <Link href={`/account/orders/${order.order_id}`} style={{
                    padding: "9px 20px", borderRadius: 10,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171", fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}>
                    Cancel Order
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
