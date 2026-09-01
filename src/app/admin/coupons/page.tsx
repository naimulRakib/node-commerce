import { Metadata } from "next";
import { prisma } from "@/lib/db";
import AdminCouponsClient from "./AdminCouponsClient";

export const metadata: Metadata = { title: "Coupons — Admin" };

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { created_at: "desc" },
  });

  const serializedCoupons = coupons.map(c => ({
    ...c,
    discount_value: c.discount_value.toString(),
    min_spend: c.min_spend.toString(),
    max_discount: c.max_discount ? c.max_discount.toString() : null,
  }));

  return <AdminCouponsClient initialCoupons={serializedCoupons} />;
}
