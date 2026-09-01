import { Metadata } from "next";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { createProductAction } from "@/actions/admin";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Add Product — Admin" };

export default async function AdminNewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  async function handleCreate(formData: FormData) {
    "use server";
    const result = await createProductAction(formData);
    if (result.productId) redirect(`/admin/products/${result.productId}/edit`);
    // Note: robust error handling should be done in a client component or via useActionState
    // For brevity in this academic demo, redirecting on success is shown.
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
        <Link href="/admin/products" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: 20 }}>←</Link>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 24, color: "white" }}>Add New Product</h1>
      </div>

      <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 28 }}>
        <form action={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Product Name *</label>
            <input name="name" required style={inputStyle} placeholder="e.g. Wireless Headphones" />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Product Code (SKU Base) *</label>
              <input name="product_code" required style={inputStyle} placeholder="e.g. HDPH-001" />
            </div>
            <div>
              <label style={labelStyle}>Base Price (৳) *</label>
              <input name="base_price" type="number" min="0" required style={inputStyle} placeholder="0.00" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <select name="category_id" style={inputStyle}>
              <option value="">Select Category...</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea name="description" rows={4} style={{ ...inputStyle, resize: "vertical" }} placeholder="Product details..." />
          </div>

          <div style={{ marginTop: 8 }}>
            <button type="submit" style={{
              padding: "12px 24px", background: "linear-gradient(135deg, #eab308, #ca8a04)",
              border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>Create Product</button>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 12 }}>
              Note: You can add variants (colors, sizes) and inventory after creating the base product.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, color: "white", fontSize: 14, outline: "none" };
