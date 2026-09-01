import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import OrderStatusBadge from "@/components/OrderStatusBadge";

export const metadata: Metadata = { title: "Orders — Admin" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";
  const page = Number(params.page ?? 1);
  const PAGE_SIZE = 15;

  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.customerOrder.findMany({
      where,
      orderBy: { order_date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        customer: { select: { name: true, email: true } },
        courier: { select: { name: true } },
        items: { select: { order_item_id: true } },
      },
    }),
    prisma.customerOrder.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const statusFilters = ["", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 24 }}>
        Orders Management
      </h1>

      {/* Status Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {statusFilters.map((s) => (
          <Link key={s} href={`/admin/orders${s ? `?status=${s}` : ""}`} style={{
            padding: "8px 16px", borderRadius: 50, fontSize: 13, textDecoration: "none",
            background: status === s ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)",
            border: status === s ? "1px solid rgba(234,179,8,0.4)" : "1px solid rgba(255,255,255,0.07)",
            color: status === s ? "#eab308" : "rgba(255,255,255,0.5)",
            fontWeight: status === s ? 600 : 400,
            textTransform: "capitalize",
          }}>{s || "All"}</Link>
        ))}
      </div>

      {/* Orders Table */}
      <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
              {["Order ID", "Customer", "Items", "Courier", "Total", "Date", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "13px 18px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr key={order.order_id} style={{ borderBottom: i < orders.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                <td style={{ padding: "13px 18px" }}><span style={{ fontFamily: "monospace", color: "#eab308", fontWeight: 700 }}>#{order.order_id}</span></td>
                <td style={{ padding: "13px 18px" }}>
                  <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>{order.customer.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{order.customer.email}</div>
                </td>
                <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{order.items.length}</td>
                <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.55)", fontSize: 13 }}>{order.courier?.name ?? "—"}</td>
                <td style={{ padding: "13px 18px" }}><span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>৳{Number(order.total_amount).toLocaleString()}</span></td>
                <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                  {new Date(order.order_date).toLocaleDateString("en-GB")}
                </td>
                <td style={{ padding: "13px 18px" }}><OrderStatusBadge status={order.status} /></td>
                <td style={{ padding: "13px 18px" }}>
                  <Link href={`/admin/orders/${order.order_id}`} style={{ fontSize: 13, color: "#eab308", textDecoration: "none", padding: "5px 12px", borderRadius: 8, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 20, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link key={p} href={`/admin/orders?${new URLSearchParams({ ...(status ? { status } : {}), page: String(p) })}`} style={{
                width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none",
                background: p === page ? "linear-gradient(135deg, #eab308, #ca8a04)" : "rgba(255,255,255,0.04)",
                color: p === page ? "white" : "rgba(255,255,255,0.5)",
              }}>{p}</Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
