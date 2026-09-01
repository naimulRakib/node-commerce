import { Metadata } from "next";
import { prisma } from "@/lib/db";
import AdminCouriersClient from "./AdminCouriersClient";

export const metadata: Metadata = { title: "Couriers — Admin" };

export default async function AdminCouriersPage() {
  const couriers = await prisma.courier.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { name: "asc" },
  });

  return <AdminCouriersClient initialCouriers={couriers} />;
}
