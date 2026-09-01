"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth";

// ─── Update Profile ───────────────────────────────────────────
export async function updateProfileAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const session = await requireCustomer();

  const full_name = formData.get("full_name") as string;
  const gender = (formData.get("gender") as string) || null;
  const date_of_birth = formData.get("date_of_birth")
    ? new Date(formData.get("date_of_birth") as string)
    : null;
  const phone = (formData.get("phone") as string) || null;

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { customer_id: session.id },
      data: { full_name, gender, date_of_birth },
    });
    await tx.customer.update({
      where: { customer_id: session.id },
      data: { phone },
    });
  });

  revalidatePath("/account/profile");
  return { success: true };
}

// ─── Delete Address ───────────────────────────────────────────
export async function deleteAddressAction(addressId: number): Promise<{ error?: string }> {
  const session = await requireCustomer();

  const addr = await prisma.address.findFirst({
    where: { address_id: addressId, customer_id: session.id },
  });
  if (!addr) return { error: "Address not found" };

  await prisma.address.delete({ where: { address_id: addressId } });
  revalidatePath("/account/profile");
  return {};
}

// ─── Set Default Address ──────────────────────────────────────
// Demonstrates transaction: unset all, then set one as default
export async function setDefaultAddressAction(addressId: number): Promise<void> {
  const session = await requireCustomer();

  await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: { customer_id: session.id },
      data: { is_default: false },
    });
    await tx.address.update({
      where: { address_id: addressId },
      data: { is_default: true },
    });
  });

  revalidatePath("/account/profile");
}
