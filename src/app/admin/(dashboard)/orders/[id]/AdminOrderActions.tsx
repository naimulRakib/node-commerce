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
  const [msgType, setMsgType] = useState<"success" | "error" | "">("");

  async function run(label: string, action: () => Promise<{ error?: string } | undefined | void>) {
    setLoading(label);
    setMsg("");
    setMsgType("");
    const result = await action();
    if (result && "error" in result && result.error) {
      setMsg(result.error);
      setMsgType("error");
    } else {
      setMsg("Done! Page will refresh...");
      setMsgType("success");
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
          padding: "12px 16px", borderRadius: 12, marginBottom: 20, display: "flex", gap: "8px", alignItems: "center",
          background: msgType === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          border: msgType === "error" ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.3)",
          color: msgType === "error" ? "#f87171" : "#4ade80", fontSize: 14,
        }}>
          {msgType === "error" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          )}
          {msg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Confirm */}
        {status === "pending" && (
          <button disabled={!!loading} id="btn-confirm-order"
            onClick={() => run("confirm", () => confirmOrderAction(orderId))}
            style={btnStyle("rgba(59,130,246,0.12)", "rgba(59,130,246,0.3)", "#60a5fa")}>
            {loading === "confirm" ? "Confirming..." : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Confirm Order
              </span>
            )}
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
            {loading === "ship" ? "Updating..." : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="15" height="13" x="1" y="3" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> Mark as Shipped
              </span>
            )}
          </button>
        )}

        {/* Mark Delivered */}
        {status === "shipped" && (
          <button disabled={!!loading} id="btn-mark-delivered"
            onClick={() => run("deliver", () => markDeliveredAction(orderId))}
            style={btnStyle("rgba(34,197,94,0.1)", "rgba(34,197,94,0.3)", "#4ade80")}>
            {loading === "deliver" ? "Updating..." : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> Mark as Delivered
              </span>
            )}
          </button>
        )}

        {/* Cancel */}
        {["pending", "confirmed"].includes(status) && (
          <button disabled={!!loading} id="btn-admin-cancel"
            onClick={() => run("cancel", () => cancelOrderAction(orderId))}
            style={btnStyle("rgba(239,68,68,0.08)", "rgba(239,68,68,0.25)", "#f87171")}>
            {loading === "cancel" ? "Cancelling..." : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> Cancel Order (Restore Inventory)
              </span>
            )}
          </button>
        )}

        {status === "delivered" && (
          <div style={{ padding: 16, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, color: "#4ade80", fontSize: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 11 2 2-2 2-2-2 2-2Z"/><path d="M22 13a10 10 0 0 0-20 0"/><path d="m9.5 9.5-3-3"/><path d="m14.5 9.5 3-3"/></svg> This order has been delivered successfully.
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


/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি প্রোজেক্টের একটি ইউটিলিটি (Utility) বা সাপোর্টিং মডিউল হিসেবে কাজ করে। টাইপস্ক্রিপ্ট (TypeScript) ব্যবহারের কারণে এতে স্ট্যাটিক টাইপ চেকিং (Static Type Checking) নিশ্চিত হয়, যা রানটাইম এরর (Runtime Error) হওয়ার সম্ভাবনা অনেকাংশে কমিয়ে দেয়।

২. লজিক (Logic):
এখানে নির্দিষ্ট কিছু হেল্পার ফাংশন, কনফিগারেশন বা টাইপ ডেফিনেশন থাকতে পারে যা প্রোজেক্টের বিভিন্ন অংশে ইমপোর্ট করে ব্যবহার করা হয় (DRY Principle - Don't Repeat Yourself)।

৩. ব্যবহারিক গুরুত্ব (Practical Significance):
কোডবেসকে ক্লিন (Clean) এবং মডুলার (Modular) রাখার জন্য এ ধরনের শেয়ার্ড ফাইলের গুরুত্ব অপরিসীম।
================================================================================
*/
