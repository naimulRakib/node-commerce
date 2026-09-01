"use client";

import { useState } from "react";
import { createCourierAction, toggleCourierAction } from "@/actions/admin";

type Courier = {
  courier_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  _count: { orders: number };
};

export default function AdminCouriersClient({ initialCouriers }: { initialCouriers: Courier[] }) {
  const [couriers, setCouriers] = useState(initialCouriers);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await createCourierAction(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.reload();
    }
  }

  async function handleToggle(id: number, current: boolean) {
    await toggleCourierAction(id, !current);
    setCouriers(prev => prev.map(c => c.courier_id === id ? { ...c, is_active: !current } : c));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white" }}>
          Couriers
        </h1>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: "11px 22px", background: showForm ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #eab308, #ca8a04)",
          border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>
          {showForm ? "Cancel" : "+ Add Courier"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "rgba(13,13,20,0.9)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 16, marginBottom: 16 }}>Register New Courier</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Courier Name *</label>
                <input name="name" required placeholder="e.g. Fast Delivery Co." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input name="phone" placeholder="Contact number" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input name="email" type="email" placeholder="contact@courier.com" style={inputStyle} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              alignSelf: "flex-start", padding: "12px 24px", background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.3)", borderRadius: 12, color: "#eab308", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
              {loading ? "Creating..." : "Save Courier"}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {couriers.map((courier) => (
          <div key={courier.courier_id} style={{
            background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: 20, opacity: courier.is_active ? 1 : 0.6,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 4 }}>
                  {courier.name}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  {courier.phone || "No phone"} • {courier.email || "No email"}
                </div>
              </div>
              <button onClick={() => handleToggle(courier.courier_id, courier.is_active)} style={{
                background: "none", border: "none", fontSize: 24, cursor: "pointer",
                color: courier.is_active ? "#4ade80" : "rgba(255,255,255,0.2)"
              }}>
                {courier.is_active ? "🟢" : "⚫"}
              </button>
            </div>

            <div style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Total Orders Handled</span>
              <span style={{ color: "white", fontWeight: 600 }}>{courier._count.orders}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", fontSize: 14, outline: "none" };
