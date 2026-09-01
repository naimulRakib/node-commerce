"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// ─── Customer Login ───────────────────────────────────────────
export async function loginAction(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required" };

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || !customer.is_active) return { error: "Invalid credentials" };

  const valid = await bcrypt.compare(password, customer.password_hash);
  if (!valid) return { error: "Invalid credentials" };

  const token = await createSession({
    id: customer.customer_id,
    email: customer.email,
    name: customer.name,
    role: "customer",
  });
  await setSessionCookie(token);
  redirect("/");
}

// ─── Customer Register ────────────────────────────────────────
// Demonstrates atomicity: Customer + Profile + Cart + Wallet + Wishlist
// all created inside one $transaction() — either all succeed or all fail.
export async function registerAction(formData: FormData): Promise<{ error?: string }> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!name || !email || !password) return { error: "Name, email and password are required" };
  if (password !== confirm) return { error: "Passwords do not match" };
  if (password.length < 6) return { error: "Password must be at least 6 characters" };

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const customer = await prisma.$transaction(async (tx) => {
      // 1. Create Customer (Strong Entity)
      const cust = await tx.customer.create({
        data: { name, email, phone: phone || null, password_hash: passwordHash, is_verified: true },
      });

      // 2. Create Profile (1:1 Weak Entity)
      await tx.profile.create({ data: { customer_id: cust.customer_id, full_name: name } });

      // 3. Create Cart (1:1)
      await tx.cart.create({ data: { customer_id: cust.customer_id } });

      // 4. Create Wallet (1:1)
      await tx.wallet.create({ data: { customer_id: cust.customer_id, balance: 0 } });

      // 5. Create Wishlist (1:1)
      await tx.wishlist.create({ data: { customer_id: cust.customer_id } });

      return cust;
    });

    await logAudit("customer", customer.customer_id, "INSERT", customer.customer_id, null, {
      name: customer.name,
      email: customer.email,
    });

    const token = await createSession({
      id: customer.customer_id,
      email: customer.email,
      name: customer.name,
      role: "customer",
    });
    await setSessionCookie(token);
    redirect("/");
  } catch (error) {
    console.error("[registerAction]", error);
    return { error: "Registration failed. Please try again." };
  }
}

// ─── Logout ───────────────────────────────────────────────────
export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
