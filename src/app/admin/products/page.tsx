import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Products — Admin" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: { select: { quantity: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white" }}>
          Products ({products.length})
        </h1>
        <Link href="/admin/products/new" style={{
          padding: "11px 22px", background: "linear-gradient(135deg, #eab308, #ca8a04)",
          borderRadius: 12, color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none",
        }}>+ Add Product</Link>
      </div>

      <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
              {["Product", "Code", "Category", "Base Price", "Stock", "Reviews", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "13px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product, i) => {
              const totalStock = product.variants.reduce((s, v) => s + v.quantity, 0);
              const isLow = totalStock <= 10 && totalStock > 0;
              const isOut = totalStock === 0;
              return (
                <tr key={product.product_id} style={{ borderBottom: i < products.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <td style={{ padding: "13px 18px" }}>
                    <div style={{ color: "white", fontSize: 14, fontWeight: 500 }}>{product.name}</div>
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{product.product_code}</span>
                  </td>
                  <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.55)", fontSize: 13 }}>{product.category?.name ?? "—"}</td>
                  <td style={{ padding: "13px 18px" }}>
                    <span className="gradient-text" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>৳{Number(product.base_price).toLocaleString()}</span>
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600, padding: "3px 10px", borderRadius: 8,
                      background: isOut ? "rgba(239,68,68,0.1)" : isLow ? "rgba(234,179,8,0.1)" : "rgba(34,197,94,0.1)",
                      color: isOut ? "#f87171" : isLow ? "#eab308" : "#4ade80",
                    }}>{totalStock} units</span>
                  </td>
                  <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>{product._count.reviews}</td>
                  <td style={{ padding: "13px 18px" }}>
                    <span style={{
                      fontSize: 12, padding: "3px 10px", borderRadius: 8,
                      background: product.is_active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: product.is_active ? "#4ade80" : "#f87171",
                    }}>{product.is_active ? "Active" : "Inactive"}</span>
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <Link href={`/admin/products/${product.product_id}/edit`} style={{ fontSize: 13, color: "#eab308", textDecoration: "none", padding: "5px 12px", borderRadius: 8, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
