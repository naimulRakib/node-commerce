import { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";
import { adminLogoutAction } from "@/actions/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0f" }}>
      <AdminSidebar adminName={session.name} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: 60, display: "flex", alignItems: "center", justifyContent: "flex-end",
          padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(10,10,15,0.9)", backdropFilter: "blur(10px)",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <form action={adminLogoutAction}>
            <button type="submit" style={{
              padding: "8px 18px", borderRadius: 10,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171", fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>Logout</button>
          </form>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 28, overflow: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
