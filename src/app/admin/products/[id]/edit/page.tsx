import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateProductAction } from "@/actions/admin";

export const metadata: Metadata = { title: "Edit Product — Admin" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params;
  
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { product_id: Number(id) },
      include: { variants: true }
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } })
  ]);

  if (!product) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateProductAction(Number(id), formData);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
        <Link href="/admin/products" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: 20 }}>←</Link>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 24, color: "white" }}>
          Edit Product: <span style={{ color: "#eab308" }}>{product.name}</span>
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        {/* Main Details */}
        <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 20 }}>Basic Information</h2>
          <form action={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Product Name</label>
              <input name="name" defaultValue={product.name} required style={inputStyle} />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Product Code (Read-only)</label>
                <input value={product.product_code} readOnly style={{ ...inputStyle, background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.4)" }} />
              </div>
              <div>
                <label style={labelStyle}>Base Price (৳)</label>
                <input name="base_price" type="number" min="0" defaultValue={Number(product.base_price)} required style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select name="category_id" defaultValue={product.category_id ?? ""} style={inputStyle}>
                  <option value="">None</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, cursor: "pointer" }}>
                  <input type="checkbox" name="is_active" defaultChecked={product.is_active} style={{ accentColor: "#eab308" }} />
                  <span style={{ color: "white", fontSize: 14 }}>Active in store</span>
                </label>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea name="description" defaultValue={product.description ?? ""} rows={5} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ marginTop: 8 }}>
              <button type="submit" style={{
                padding: "12px 24px", background: "linear-gradient(135deg, #eab308, #ca8a04)",
                border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}>Save Changes</button>
            </div>
          </form>
        </div>

        {/* Variants (Read-only for demo) */}
        <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24, height: "fit-content" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 16 }}>Variants & Inventory</h2>
          {product.variants.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No variants added yet. Stock is managed at product level.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {product.variants.map(v => (
                <div key={v.variant_code} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{v.color} {v.size ? `/ ${v.size}` : ""}</span>
                    <span style={{ color: v.quantity <= 5 ? "#f87171" : "#4ade80", fontSize: 13, fontWeight: 600 }}>{v.quantity} in stock</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "monospace" }}>{v.sku}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16, padding: 12, background: "rgba(59,130,246,0.1)", borderRadius: 10, color: "#60a5fa", fontSize: 12 }}>
            ℹ️ Managing variants and deep inventory is outside the scope of this view. Use database seed or dedicated inventory tools.
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, color: "white", fontSize: 14, outline: "none" };
