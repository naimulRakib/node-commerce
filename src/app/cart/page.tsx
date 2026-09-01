import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Shopping Cart — NodeCommerce",
  description: "Review your cart and proceed to checkout.",
};

export default async function CartPage() {
  const session = await getSession();
  if (!session || session.role !== "customer") redirect("/login");

  const cart = await prisma.cart.findUnique({
    where: { customer_id: session.id },
    include: {
      items: {
        include: {
          product: { select: { product_id: true, name: true, base_price: true } },
          variant: { select: { variant_code: true, color: true, size: true, price_override: true } },
        },
        orderBy: { added_at: "desc" },
      },
    },
  });

  const items = (cart?.items ?? []).map(item => ({
    cart_item_id: item.cart_item_id,
    quantity: item.quantity,
    product: {
      product_id: item.product.product_id,
      name: item.product.name,
      base_price: Number(item.product.base_price),
    },
    variant: item.variant ? {
      variant_code: item.variant.variant_code,
      color: item.variant.color,
      size: item.variant.size,
      price_override: item.variant.price_override ? Number(item.variant.price_override) : null,
    } : null,
  }));

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
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 32, color: "white" }}>
              Shopping Cart
            </h1>
          </div>
        </div>
        <div className="container" style={{ padding: "32px 24px" }}>
          <CartClient items={items} />
        </div>
      </main>
      <Footer />
    </>
  );
}
