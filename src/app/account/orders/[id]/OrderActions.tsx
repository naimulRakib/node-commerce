"use client";

import { useState } from "react";
import { cancelOrderAction, requestReturnAction } from "@/actions/order";

export function CancelOrderButton({ orderId }: { orderId: number }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setLoading(true);
    const result = await cancelOrderAction(orderId);
    if (result?.error) { setError(result.error); setLoading(false); }
    else { setDone(true); }
  }

  if (done) return <span style={{ color: "#f87171", fontSize: 14 }}>Order cancelled</span>;

  return (
    <div>
      <button onClick={handleCancel} disabled={loading} id={`cancel-order-${orderId}`} style={{
        padding: "10px 20px", borderRadius: 10,
        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
        color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer",
      }}>
        {loading ? "Cancelling..." : "Cancel Order"}
      </button>
      {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p>}
    </div>
  );
}

export function ReturnRequestForm({ orderId, productId }: { orderId: number; productId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await requestReturnAction(orderId, productId, reason);
    setMsg(result.error ?? (result.success ? "Return request submitted!" : ""));
    if (result.success) setOpen(false);
  }

  return (
    <div>
      <button onClick={() => setOpen(!open)} style={{
        fontSize: 12, color: "#f87171", background: "none", border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 8, padding: "5px 12px", cursor: "pointer",
      }}>Request Return</button>
      {open && (
        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="Reason for return..." required
            style={{
              width: "100%", padding: "10px 14px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 10, color: "white", fontSize: 13, resize: "none", outline: "none",
            }}
          />
          <button type="submit" style={{
            marginTop: 8, padding: "8px 16px", borderRadius: 10,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Submit Return Request</button>
        </form>
      )}
      {msg && <p style={{ fontSize: 13, color: msg.includes("error") ? "#f87171" : "#4ade80", marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
