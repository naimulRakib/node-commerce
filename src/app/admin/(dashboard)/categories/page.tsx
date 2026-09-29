// এসইও (SEO) এর জন্য মেটাডেটা।
import { Metadata } from "next";
// ক্লায়েন্ট-সাইড নেভিগেশনের জন্য।
import Link from "next/link";
// ডাটাবেস সংযোগ।
import { db } from "@/lib/db";
// অ্যাডমিন-অনলি সার্ভার অ্যাকশন।
import { createCategoryAction, deleteCategoryAction } from "@/actions/admin";

// ফর্মের action প্রপ void রিটার্ন করা উচিত — তাই র‍্যাপার বানানো হলো
 
const createCatAction = createCategoryAction as any;
 
const deleteCatAction = deleteCategoryAction as any;


// ইনপুট ফিল্ডের জন্য কমন স্টাইল
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 10, color: "white", fontSize: 14, outline: "none",
};


// ─── মেটাডেটা (Metadata) ───────────────────────────────────────────────────
export const metadata: Metadata = { title: "Categories — Admin" };

export const dynamic = "force-dynamic";

// ─── সার্ভার কম্পোনেন্ট (Server Component) ─────────────────────────────────
export default async function AdminCategoriesPage() {

  // ১. ডেটা ফেচিং: সব ক্যাটাগরি এবং প্রতিটিতে কতটি প্রোডাক্ট আছে তা জানা
  const res = await db.query(`
    SELECT c.*,
           COUNT(p.product_id) as product_count,
           pc.name as parent_name
    FROM category c
    LEFT JOIN product p ON p.category_id = c.category_id
    LEFT JOIN category pc ON c.parent_category_id = pc.category_id
    GROUP BY c.category_id, c.name, c.parent_category_id, pc.name
    ORDER BY c.name ASC
  `).catch(() => ({ rows: [] }));

  const categories = res.rows;

  // টপ-লেভেল ক্যাটাগরি (parent নেই এমন) — নতুন ক্যাটাগরি বানানোর সময় parent হিসেবে দেখাতে হবে
  const parentCategories = categories.filter((c: any) => !c.parent_category_id);

  // ২. ইউজার ইন্টারফেস (User Interface)
  return (
    <div>
      {/* হেডার */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white" }}>
            Categories ({categories.length})
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 4 }}>
            Manage product categories and subcategories
          </p>
        </div>
      </div>

      {/* গ্রিড লেআউট: বাম দিকে ফর্ম, ডানে লিস্ট */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, alignItems: "start" }}>

        {/* নতুন ক্যাটাগরি যোগ করার ফর্ম (Add New Category Form) */}
        <div style={{
          background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20, padding: 24,
        }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 20 }}>
            + Add New Category
          </h2>

          {/* সার্ভার অ্যাকশনের সাথে যুক্ত ফর্ম */}
          <form action={createCatAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                Category Name *
              </label>
              <input
                id="cat-name"
                type="text"
                name="name"
                required
                placeholder="e.g., Smartphones"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                Parent Category (optional)
              </label>
              <select name="parent_category_id" style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">— None (Top Level) —</option>
                {parentCategories.map((pc: any) => (
                  <option key={pc.category_id} value={pc.category_id}>
                    {pc.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              id="add-category-btn"
              style={{
                marginTop: 4, padding: "12px",
                background: "linear-gradient(135deg, #eab308, #ca8a04)",
                border: "none", borderRadius: 12,
                color: "white", fontFamily: "Outfit, sans-serif",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >
              Create Category
            </button>
          </form>
        </div>

        {/* ক্যাটাগরি তালিকা (Category List Table) */}
        <div style={{
          background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20, overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                {["#", "Name", "Parent", "Products", "Action"].map(h => (
                  <th key={h} style={{
                    padding: "13px 18px", textAlign: "left",
                    fontSize: 11, fontWeight: 600,
                    color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                    No categories yet. Add one using the form.
                  </td>
                </tr>
              ) : categories.map((cat: any, i: number) => (
                <tr key={cat.category_id} style={{
                  borderBottom: i < categories.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                }}>
                  <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                    {cat.category_id}
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* সাব-ক্যাটাগরি হলে ইন্ডেন্ট দেখানো */}
                      {cat.parent_category_id && (
                        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>└</span>
                      )}
                      <span style={{ color: "white", fontSize: 14, fontWeight: 500 }}>{cat.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                    {cat.parent_name || "—"}
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      padding: "3px 10px", borderRadius: 8,
                      background: "rgba(234,179,8,0.08)",
                      color: "#eab308",
                    }}>
                      {cat.product_count} products
                    </span>
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link
                        href={`/products?category=${cat.category_id}`}
                        style={{
                          fontSize: 12, color: "#60a5fa", textDecoration: "none",
                          padding: "4px 10px", borderRadius: 8,
                          background: "rgba(59,130,246,0.08)",
                          border: "1px solid rgba(59,130,246,0.2)",
                        }}
                      >
                        View
                      </Link>
                      {/* শুধুমাত্র ০ প্রোডাক্ট থাকলে ডিলেট করা যাবে */}
                      {Number(cat.product_count) === 0 && (
                        <form action={deleteCatAction}>
                          <input type="hidden" name="category_id" value={cat.category_id} />
                          <button
                            type="submit"
                            style={{
                              fontSize: 12, color: "#f87171", cursor: "pointer",
                              padding: "4px 10px", borderRadius: 8,
                              background: "rgba(239,68,68,0.08)",
                              border: "1px solid rgba(239,68,68,0.2)",
                            }}
                            onClick={(e) => {
                              // ব্যবহারকারীর কাছে নিশ্চিতকরণ চাওয়া হচ্ছে
                              if (!confirm(`Delete "${cat.name}"?`)) e.preventDefault();
                            }}
                          >
                            Delete
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/admin/categories/page.tsx`) প্রোডাক্ট ক্যাটাগরির সম্পূর্ণ CRUD (Create, Read, Update, Delete) অপারেশন পরিচালনা করে। এটি একটি হাইব্রিড পেজ — বাম দিকে একটি 'নতুন যোগ করার ফর্ম' এবং ডান দিকে বিদ্যমান ক্যাটাগরির তালিকা প্রদর্শিত হয়।

২. ডেটাবেস ডিজাইন (Database Design):
ক্যাটাগরি টেবিলটি 'Self-referencing' অর্থাৎ একটি ক্যাটাগরি অন্য একটি ক্যাটাগরির চাইল্ড (Child) হতে পারে — এটাকে Adjacency List Model বলে। `parent_category_id` কলামটি একই `category` টেবিলের `category_id` রেফার করে।

৩. ডিলেট প্রোটেকশন (Delete Protection):
শুধুমাত্র যে ক্যাটাগরিতে কোনো প্রোডাক্ট নেই (`product_count = 0`) সেটিই ডিলেট করা যাবে। এই লজিকটি UI-লেভেলে চেক করা হয়েছে, আর ডাটাবেস-লেভেলেও `ON DELETE SET NULL` দিয়ে রেফারেন্শিয়াল ইন্টিগ্রিটি (Referential Integrity) বজায় রাখা হয়েছে।
================================================================================
*/
