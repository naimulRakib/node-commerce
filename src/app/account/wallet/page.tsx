import { Metadata } from "next";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "My Wallet — NodeCommerce" };

export default async function WalletPage() {
  const session = await requireCustomer();

  const [wallet, refunds] = await Promise.all([
    prisma.wallet.findUnique({ where: { customer_id: session.id } }),
    prisma.refund.findMany({
      where: {
        status: "processed",
        return_request: { order: { customer_id: session.id } },
      },
      include: { return_request: { include: { order: { select: { order_id: true } } } } },
      orderBy: { processed_at: "desc" },
      take: 10,
    }),
  ]);

  const balance = Number(wallet?.balance ?? 0);

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 28 }}>My Wallet</h1>

      {/* Balance Card */}
      <div style={{
        background: "linear-gradient(135deg, rgba(234,179,8,0.15), rgba(168,85,247,0.1))",
        border: "1px solid rgba(234,179,8,0.2)", borderRadius: 24, padding: "40px 32px",
        marginBottom: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(234,179,8,0.05)" }} />
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Available Balance</div>
        <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900, fontSize: 52, color: "white" }}>
          ৳{balance.toLocaleString()}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
          Use at checkout for instant discount
        </div>
      </div>

      {/* Transaction History */}
      <div style={{ background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24 }}>
        <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 20 }}>
          Refund History
        </h2>
        {refunds.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
            No refunds yet
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {refunds.map((r) => (
              <div key={r.refund_id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: "white", fontSize: 14 }}>
                    Refund — Order #{r.return_request.order.order_id}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>
                    {r.processed_at ? new Date(r.processed_at).toLocaleDateString() : "Processing"}
                  </div>
                </div>
                <span style={{ color: "#4ade80", fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16 }}>
                  +৳{Number(r.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
