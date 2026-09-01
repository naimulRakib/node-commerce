import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({ 
      where: { email: email.trim().toLowerCase() } 
    });
    
    if (!customer || !customer.is_active) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, customer.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createSession({
      id: customer.customer_id,
      email: customer.email,
      name: customer.name,
      role: "customer",
    });
    
    // Set the cookie
    await setSessionCookie(token);

    return NextResponse.json({
      message: "Login successful",
      customer: {
        id: customer.customer_id,
        name: customer.name,
        email: customer.email,
      }
    });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
