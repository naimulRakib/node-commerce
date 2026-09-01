"use client";

import { useState } from "react";
import {
  confirmOrderAction,
  assignCourierAction,
  approveCourierAction,
  markShippedAction,
  markDeliveredAction,
} from "@/actions/admin";
import { cancelOrderAction } from "@/actions/order";

type Courier = { courier_id: number; name: string };

export default function AdminOrderActions({
  orderId,
  status,
  couriers,
  currentCourierId,
}: {
  orderId: number;
  status: string;
  couriers: Courier[];
  currentCourierId: number | null;
}) {
  const [selectedCourier, setSelectedCourier] = useState<number | null>(currentCourierId);
  const [loading, setLoading] = useState("");
  const [msg, setMsg] = useState("");

  async function run(label: string, action: () => Promise<{ error?: string } | undefined | void>) {
    setLoading(label);
    setMsg("");
    const result = await action();
    if (result && "error" in result && result.error) {
      setMsg(`❌ ${result.error}`);
    } else {
      setMsg("✅ Done! Page will refresh...");
      setTimeout(() => window.location.reload(), 1200);
    }
    setLoading("");
  }

  const btnStyle = (bg: string, border: string, color: string): React.CSSProperties => ({
    padding: "11px 20px", borderRadius: 12,
    background: bg, border: `1px solid ${border}`, color,
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    opacity: loading ? 0.6 : 1,
  });

  return (
    <div style={{
      background: "rgba(13,13,20,0.9)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 20, padding: 24,
    }}>
      <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 24 }}>
        ⚙️ Order Actions
      </h2>

      {msg && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, marginBottom: 20,
          background: msg.includes("❌") ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          border: msg.includes("❌") ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.3)",
          color: msg.includes("❌") ? "#f87171" : "#4ade80", fontSize: 14,
        }}>{msg}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Confirm */}
        {status === "pending" && (
          <button disabled={!!loading} id="btn-confirm-order"
            onClick={() => run("confirm", () => confirmOrderAction(orderId))}
            style={btnStyle("rgba(59,130,246,0.12)", "rgba(59,130,246,0.3)", "#60a5fa")}>
            {loading === "confirm" ? "Confirming..." : "✅ Confirm Order"}
          </button>
        )}

        {/* Assign Courier */}
        {["pending", "confirmed"].includes(status) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Assign Courier</label>
            <div style={{ display: "flex", gap: 10 }}>
              <select
                value={selectedCourier ?? ""}
                onChange={e => setSelectedCourier(Number(e.target.value))}
                style={{
                  flex: 1, padding: "10px 14px",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 10, color: "white", fontSize: 14, outline: "none",
                }}
              >
                <option value="">Select courier...</option>
                {couriers.map(c => (
                  <option key={c.courier_id} value={c.courier_id}>{c.name}</option>
                ))}
              </select>
              <button
                disabled={!!loading || !selectedCourier}
                id="btn-assign-courier"
                onClick={() => run("assign", () => assignCourierAction(orderId, selectedCourier!))}
                style={btnStyle("rgba(234,179,8,0.1)", "rgba(234,179,8,0.3)", "#eab308")}>
                {loading === "assign" ? "Saving..." : "Assign"}
              </button>
            </div>
          </div>
        )}

        {/* Approve Courier → Processing */}
        {status === "confirmed" && (
          <button disabled={!!loading} id="btn-approve-courier"
            onClick={() => run("approve", () => approveCourierAction(orderId))}
            style={btnStyle("rgba(168,85,247,0.12)", "rgba(168,85,247,0.3)", "#c084fc")}>
            {loading === "approve" ? "Processing..." : "⚙️ Approve Courier & Start Processing"}
          </button>
        )}

        {/* Mark Shipped */}
        {status === "processing" && (
          <button disabled={!!loading} id="btn-mark-shipped"
            onClick={() => run("ship", () => markShippedAction(orderId))}
            style={btnStyle("rgba(249,115,22,0.1)", "rgba(249,115,22,0.3)", "#fb923c")}>
            {loading === "ship" ? "Updating..." : "🚚 Mark as Shipped"}
          </button>
        )}

        {/* Mark Delivered */}
        {status === "shipped" && (
          <button disabled={!!loading} id="btn-mark-delivered"
            onClick={() => run("deliver", () => markDeliveredAction(orderId))}
            style={btnStyle("rgba(34,197,94,0.1)", "rgba(34,197,94,0.3)", "#4ade80")}>
            {loading === "deliver" ? "Updating..." : "📦 Mark as Delivered"}
          </button>
        )}

        {/* Cancel */}
        {["pending", "confirmed"].includes(status) && (
          <button disabled={!!loading} id="btn-admin-cancel"
            onClick={() => run("cancel", () => cancelOrderAction(orderId))}
            style={btnStyle("rgba(239,68,68,0.08)", "rgba(239,68,68,0.25)", "#f87171")}>
            {loading === "cancel" ? "Cancelling..." : "❌ Cancel Order (Restore Inventory)"}
          </button>
        )}

        {status === "delivered" && (
          <div style={{ padding: 16, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, color: "#4ade80", fontSize: 14 }}>
            🎉 This order has been delivered successfully.
          </div>
        )}
        {status === "cancelled" && (
          <div style={{ padding: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#f87171", fontSize: 14 }}>
            This order has been cancelled. Inventory has been restored.
          </div>
        )}
      </div>
    </div>
  );
}
