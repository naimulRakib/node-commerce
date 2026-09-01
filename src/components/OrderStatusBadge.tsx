type Status =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "requested"
  | "approved"
  | "rejected"
  | "completed";

const statusConfig: Record<
  Status,
  { label: string; bg: string; color: string; border: string; icon: string }
> = {
  pending:    { label: "Pending",    bg: "rgba(234,179,8,0.12)",  color: "#facc15", border: "rgba(234,179,8,0.3)",   icon: "⏳" },
  confirmed:  { label: "Confirmed",  bg: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "rgba(59,130,246,0.3)",  icon: "✅" },
  processing: { label: "Processing", bg: "rgba(168,85,247,0.12)", color: "#c084fc", border: "rgba(168,85,247,0.3)",  icon: "⚙️" },
  shipped:    { label: "Shipped",    bg: "rgba(249,115,22,0.12)", color: "#fb923c", border: "rgba(249,115,22,0.3)",  icon: "🚚" },
  delivered:  { label: "Delivered",  bg: "rgba(34,197,94,0.12)",  color: "#4ade80", border: "rgba(34,197,94,0.3)",   icon: "📦" },
  cancelled:  { label: "Cancelled",  bg: "rgba(239,68,68,0.12)",  color: "#f87171", border: "rgba(239,68,68,0.3)",   icon: "❌" },
  requested:  { label: "Requested",  bg: "rgba(234,179,8,0.12)",  color: "#facc15", border: "rgba(234,179,8,0.3)",   icon: "📋" },
  approved:   { label: "Approved",   bg: "rgba(34,197,94,0.12)",  color: "#4ade80", border: "rgba(34,197,94,0.3)",   icon: "✅" },
  rejected:   { label: "Rejected",   bg: "rgba(239,68,68,0.12)",  color: "#f87171", border: "rgba(239,68,68,0.3)",   icon: "❌" },
  completed:  { label: "Completed",  bg: "rgba(34,197,94,0.12)",  color: "#4ade80", border: "rgba(34,197,94,0.3)",   icon: "🎉" },
};

export default function OrderStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as Status] ?? {
    label: status, bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)",
    border: "rgba(255,255,255,0.15)", icon: "•",
  };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 100,
      background: config.bg, color: config.color,
      border: `1px solid ${config.border}`,
      fontSize: 12, fontWeight: 600, letterSpacing: 0.3,
    }}>
      {config.icon} {config.label}
    </span>
  );
}
