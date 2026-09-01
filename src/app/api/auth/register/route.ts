import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const lowerEmail = email.trim().toLowerCase();

    const existing = await prisma.customer.findUnique({ where: { email: lowerEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const customer = await prisma.$transaction(async (tx) => {
      // 1. Create Customer (Strong Entity)
      const cust = await tx.customer.create({
        data: { 
          name: name.trim(), 
          email: lowerEmail, 
          phone: phone ? phone.trim() : null, 
          password_hash: passwordHash, 
          is_verified: true 
        },
      });

      // 2. Create Profile (1:1 Weak Entity)
      await tx.profile.create({ data: { customer_id: cust.customer_id, full_name: name.trim() } });

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
    
    // Set the cookie via lib/auth standard helper
    await setSessionCookie(token);

    return NextResponse.json(
      { 
        message: "Registration successful", 
        customer: {
          id: customer.customer_id,
          name: customer.name,
          email: customer.email
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
