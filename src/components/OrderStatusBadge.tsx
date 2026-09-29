// অর্ডারের সম্ভাব্য সব স্ট্যাটাসের জন্য একটি ইউনিয়ন টাইপ (Union Type) ডিফাইন করা হয়েছে।
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

// ─── কনফিগারেশন ম্যাপ (Configuration Map) ──────────────────────────────────────────
// প্রতিটি স্ট্যাটাসের জন্য একটি নির্দিষ্ট কালার প্যালেট, লেবেল এবং আইকন ম্যাপ করা হয়েছে।
// এটি একটি 'Lookup Table' প্যাটার্ন, যা ইফ-এলস (if-else) বা সুইচ (switch) স্টেটমেন্ট এড়াতে সাহায্য করে।
const statusConfig: Record<
  Status,
  { label: string; bg: string; color: string; border: string; icon: React.ReactNode }
> = {
  pending:    { label: "Pending",    bg: "rgba(234,179,8,0.12)",  color: "#facc15", border: "rgba(234,179,8,0.3)",   icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  confirmed:  { label: "Confirmed",  bg: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "rgba(59,130,246,0.3)",  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> },
  processing: { label: "Processing", bg: "rgba(168,85,247,0.12)", color: "#c084fc", border: "rgba(168,85,247,0.3)",  icon: "⚙️" },
  shipped:    { label: "Shipped",    bg: "rgba(249,115,22,0.12)", color: "#fb923c", border: "rgba(249,115,22,0.3)",  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="15" height="13" x="1" y="3" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  delivered:  { label: "Delivered",  bg: "rgba(34,197,94,0.12)",  color: "#4ade80", border: "rgba(34,197,94,0.3)",   icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> },
  cancelled:  { label: "Cancelled",  bg: "rgba(239,68,68,0.12)",  color: "#f87171", border: "rgba(239,68,68,0.3)",   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> },
  requested:  { label: "Requested",  bg: "rgba(234,179,8,0.12)",  color: "#facc15", border: "rgba(234,179,8,0.3)",   icon: "📋" },
  approved:   { label: "Approved",   bg: "rgba(34,197,94,0.12)",  color: "#4ade80", border: "rgba(34,197,94,0.3)",   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> },
  rejected:   { label: "Rejected",   bg: "rgba(239,68,68,0.12)",  color: "#f87171", border: "rgba(239,68,68,0.3)",   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> },
  completed:  { label: "Completed",  bg: "rgba(34,197,94,0.12)",  color: "#4ade80", border: "rgba(34,197,94,0.3)",   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 11 2 2-2 2-2-2 2-2Z"/><path d="M22 13a10 10 0 0 0-20 0"/><path d="m9.5 9.5-3-3"/><path d="m14.5 9.5 3-3"/></svg> },
};

// ─── ব্যাজ কম্পোনেন্ট (Badge Component) ──────────────────────────────────────────
export default function OrderStatusBadge({ status }: { status: string }) {
  // ডিকশনারি থেকে স্ট্যাটাস অনুযায়ী কনফিগ বের করা। 
  // যদি কোনো অজানা (Unknown) স্ট্যাটাস আসে, তবে একটি ফলব্যাক (Fallback) স্টাইল প্রয়োগ করা হবে।
  const config = statusConfig[status as Status] ?? {
    label: status, bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)",
    border: "rgba(255,255,255,0.15)", icon: "•",
  };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 100, // পিল (Pill) শেপের জন্য
      background: config.bg, color: config.color,
      border: `1px solid ${config.border}`,
      fontSize: 12, fontWeight: 600, letterSpacing: 0.3, // টাইপোগ্রাফি (Typography) এনহ্যান্সমেন্ট
    }}>
      {config.icon} {config.label}
    </span>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/components/OrderStatusBadge.tsx`) একটি রিইউজেবল রিয়্যাক্ট কম্পোনেন্ট (Reusable React Component), যা বিভিন্ন অর্ডারের স্ট্যাটাসকে (Status) সুন্দরভাবে ব্যাজ (Badge) বা ট্যাগ হিসেবে প্রদর্শন করে। এটি একটি পিওর কম্পোনেন্ট (Pure Component), যা শুধুমাত্র ইনপুট (props) এর উপর নির্ভর করে আউটপুট তৈরি করে।

২. ডেটা স্ট্রাকচার ও ডিজাইন প্যাটার্ন (Data Structure & Design Pattern):
এখানে 'লুকআপ টেবিল (Lookup Table)' বা ডিকশনারি প্যাটার্ন ব্যবহার করা হয়েছে (`statusConfig` অবজেক্ট)। অনেকগুলো `if-else` বা `switch-case` লেখার বদলে, স্ট্যাটাসের নামকে 'কি (Key)' হিসেবে ধরে সরাসরি O(1) কমপ্লেক্সিটিতে তার কনফিগারেশন বের করা হয়। এটি কোডকে পরিষ্কার (Clean) এবং রক্ষণাবেক্ষণযোগ্য (Maintainable) করে।

৩. ইউজার এক্সপেরিয়েন্স (UX):
অর্ডারের স্ট্যাটাস খুব দ্রুত বোঝার জন্য কালার সাইকোলজি (Color Psychology) এবং সেমান্টিক আইকন (Semantic Icons) ব্যবহার করা হয়েছে। যেমন:
- সবুজ (Green) = সফল (Delivered, Approved)
- লাল (Red) = ব্যর্থ বা বাতিল (Cancelled, Rejected)
- হলুদ/অরেঞ্জ (Yellow/Orange) = চলমান (Pending, Shipped)
================================================================================
*/
