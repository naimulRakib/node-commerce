import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role === "customer") {
      const customer = await prisma.customer.findUnique({
        where: { customer_id: session.id },
        select: {
          customer_id: true,
          name: true,
          email: true,
          phone: true,
          is_verified: true,
          profile: true,
          wallet: true,
        }
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ user: customer, role: "customer" });
    }

    // Handled admin scenario
    if (session.role === "admin" || session.role === "super_admin") {
      const admin = await prisma.adminUser.findUnique({
        where: { admin_id: session.id },
        select: {
          admin_id: true,
          name: true,
          email: true,
          role: true,
        }
      });

      if (!admin) {
        return NextResponse.json(
          { error: "Admin not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ user: admin, role: session.role });
    }

    return NextResponse.json(
      { error: "Invalid role in session" },
      { status: 403 }
    );

  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
