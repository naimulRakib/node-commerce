import { Metadata } from "next";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata: Metadata = { title: "Customers — Admin" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const PAGE_SIZE = 20;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { created_at: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { orders: true, reviews: true } },
        orders: {
          select: { total_amount: true, status: true },
        },
      },
    }),
    prisma.customer.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 28 }}>
        Customers ({total})
      </h1>

      <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
              {["Customer", "Contact", "Joined", "Orders", "Total Spent", "Reviews", "Status"].map(h => (
                <th key={h} style={{ padding: "13px 18px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => {
              const totalSpent = c.orders
                .filter(o => !["cancelled", "pending"].includes(o.status))
                .reduce((sum, o) => sum + Number(o.total_amount), 0);

              return (
                <tr key={c.customer_id} style={{ borderBottom: i < customers.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <td style={{ padding: "13px 18px" }}>
                    <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "monospace", marginTop: 2 }}>ID: {c.customer_id}</div>
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{c.email}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{c.phone || "—"}</div>
                  </td>
                  <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "13px 18px", color: "white", fontWeight: 600 }}>{c._count.orders}</td>
                  <td style={{ padding: "13px 18px" }}>
                    <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>৳{totalSpent.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{c._count.reviews}</td>
                  <td style={{ padding: "13px 18px" }}>
                    <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 8, background: c.is_active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: c.is_active ? "#4ade80" : "#f87171" }}>
                      {c.is_active ? "Active" : "Banned"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 20, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link key={p} href={`/admin/customers?page=${p}`} style={{
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
