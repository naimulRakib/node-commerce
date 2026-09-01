import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout — NodeCommerce",
  description: "Complete your purchase securely.",
};

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session || session.role !== "customer") redirect("/login");

  const [cart, addresses, couriers] = await Promise.all([
    prisma.cart.findUnique({
      where: { customer_id: session.id },
      include: {
        items: {
          include: {
            product: { select: { base_price: true } },
            variant: { select: { price_override: true } },
          },
        },
      },
    }),
    prisma.address.findMany({
      where: { customer_id: session.id },
      orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
    }),
    prisma.courier.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!cart || cart.items.length === 0) redirect("/cart");

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.variant?.price_override ?? item.product.base_price;
    return sum + Number(price) * item.quantity;
  }, 0);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "100vh" }}>
        <div style={{
          background: "linear-gradient(180deg, rgba(234,179,8,0.04) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "36px 0 28px",
        }}>
          <div className="container">
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 32, color: "white", marginBottom: 6 }}>
              Checkout
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
              Step 2 of 2 — Complete your order
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: "32px 24px" }}>
          <CheckoutClient
            addresses={addresses.map(a => ({
              address_id: a.address_id,
              label: a.label,
              address_line1: a.address_line1,
              city: a.city,
              district: a.district,
              is_default: a.is_default,
            }))}
            couriers={couriers.map(c => ({
              courier_id: c.courier_id,
              name: c.name,
            }))}
            cart={{ subtotal, itemCount: cart.items.length }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
