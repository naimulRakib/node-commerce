"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/transactions";
import { logAudit } from "@/lib/audit";

// ─── Admin Login ──────────────────────────────────────────────
export async function adminLoginAction(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required" };

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.is_active) return { error: "Invalid credentials" };

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return { error: "Invalid credentials" };

  const token = await createSession({
    id: admin.admin_id,
    email: admin.email,
    name: admin.name,
    role: admin.role as "admin" | "super_admin",
  });
  await setSessionCookie(token);
  redirect("/admin");
}

// ─── Admin Logout ─────────────────────────────────────────────
export async function adminLogoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}

// ─── Confirm Order ────────────────────────────────────────────
export async function confirmOrderAction(orderId: number): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const result = await updateOrderStatus(orderId, "confirmed", admin.id);
  if (!result.success) return { error: result.error };

  // Create notification for customer
  const order = await prisma.customerOrder.findUnique({ where: { order_id: orderId } });
  if (order) {
    await prisma.notification.create({
      data: {
        customer_id: order.customer_id,
        type: "order_update",
        message: `Your order #${orderId} has been confirmed and is being processed.`,
      },
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

// ─── Assign Courier ───────────────────────────────────────────
export async function assignCourierAction(
  orderId: number,
  courierId: number
): Promise<{ error?: string }> {
  const admin = await requireAdmin();

  const order = await prisma.customerOrder.findUnique({ where: { order_id: orderId } });
  if (!order) return { error: "Order not found" };

  const oldCourier = order.courier_id;
  await prisma.customerOrder.update({
    where: { order_id: orderId },
    data: { courier_id: courierId },
  });

  await logAudit("customer_order", orderId, "UPDATE", admin.id,
    { courier_id: oldCourier },
    { courier_id: courierId }
  );

  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}

// ─── Approve Courier / Move to Processing ────────────────────
export async function approveCourierAction(orderId: number): Promise<{ error?: string }> {
  const admin = await requireAdmin();

  const order = await prisma.customerOrder.findUnique({ where: { order_id: orderId } });
  if (!order) return { error: "Order not found" };
  if (!order.courier_id) return { error: "Please assign a courier first" };
  if (order.status !== "confirmed") return { error: "Order must be confirmed before approving courier" };

  const result = await updateOrderStatus(orderId, "processing", admin.id, order.courier_id);
  if (!result.success) return { error: result.error };

  const customer = await prisma.customerOrder.findUnique({
    where: { order_id: orderId },
    select: { customer_id: true },
  });
  if (customer) {
    await prisma.notification.create({
      data: {
        customer_id: customer.customer_id,
        type: "order_update",
        message: `Your order #${orderId} is being prepared for shipment.`,
      },
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

// ─── Mark Shipped ─────────────────────────────────────────────
export async function markShippedAction(orderId: number): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const result = await updateOrderStatus(orderId, "shipped", admin.id);
  if (!result.success) return { error: result.error };

  const order = await prisma.customerOrder.findUnique({ where: { order_id: orderId } });
  if (order) {
    await prisma.notification.create({
      data: {
        customer_id: order.customer_id,
        type: "order_update",
        message: `Your order #${orderId} has been shipped and is on its way!`,
      },
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

// ─── Mark Delivered ───────────────────────────────────────────
export async function markDeliveredAction(orderId: number): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const result = await updateOrderStatus(orderId, "delivered", admin.id);
  if (!result.success) return { error: result.error };

  const order = await prisma.customerOrder.findUnique({ where: { order_id: orderId } });
  if (order) {
    await prisma.notification.create({
      data: {
        customer_id: order.customer_id,
        type: "order_update",
        message: `Your order #${orderId} has been delivered. Enjoy your purchase!`,
      },
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

// ─── Create Product ───────────────────────────────────────────
export async function createProductAction(formData: FormData): Promise<{ error?: string; productId?: number }> {
  await requireAdmin();

  const name = formData.get("name") as string;
  const product_code = formData.get("product_code") as string;
  const description = formData.get("description") as string;
  const base_price = Number(formData.get("base_price"));
  const category_id = formData.get("category_id") ? Number(formData.get("category_id")) : undefined;

  if (!name || !product_code || !base_price) {
    return { error: "Name, product code, and price are required" };
  }

  try {
    const product = await prisma.product.create({
      data: { name, product_code, description, base_price, category_id },
    });
    revalidatePath("/admin/products");
    return { productId: product.product_id };
  } catch {
    return { error: "Product code already exists or creation failed" };
  }
}

// ─── Update Product ───────────────────────────────────────────
export async function updateProductAction(
  productId: number,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const base_price = Number(formData.get("base_price"));
  const is_active = formData.get("is_active") === "on";
  const category_id = formData.get("category_id") ? Number(formData.get("category_id")) : undefined;

  await prisma.product.update({
    where: { product_id: productId },
    data: { name, description, base_price, is_active, category_id },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/products");
  return {};
}

// ─── Create Coupon ────────────────────────────────────────────
export async function createCouponAction(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();

  const code = (formData.get("code") as string)?.toUpperCase().trim();
  const discount_type = formData.get("discount_type") as string;
  const discount_value = Number(formData.get("discount_value"));
  const min_spend = Number(formData.get("min_spend") || 0);
  const max_discount = formData.get("max_discount") ? Number(formData.get("max_discount")) : undefined;
  const usage_limit = formData.get("usage_limit") ? Number(formData.get("usage_limit")) : undefined;
  const expiry_date = formData.get("expiry_date") ? new Date(formData.get("expiry_date") as string) : undefined;

  if (!code || !discount_type || !discount_value) {
    return { error: "Code, type, and value are required" };
  }

  try {
    await prisma.coupon.create({
      data: { code, discount_type, discount_value, min_spend, max_discount, expiry_date, usage_limit },
    });
    revalidatePath("/admin/coupons");
    return {};
  } catch {
    return { error: "Coupon code already exists" };
  }
}

// ─── Toggle Coupon Active ─────────────────────────────────────
export async function toggleCouponAction(code: string, is_active: boolean): Promise<void> {
  await requireAdmin();
  await prisma.coupon.update({ where: { code }, data: { is_active } });
  revalidatePath("/admin/coupons");
}

// ─── Create Courier ───────────────────────────────────────────
export async function createCourierAction(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;

  if (!name) return { error: "Courier name is required" };

  await prisma.courier.create({ data: { name, phone, email } });
  revalidatePath("/admin/couriers");
  return {};
}

// ─── Toggle Courier Active ────────────────────────────────────
export async function toggleCourierAction(courierId: number, is_active: boolean): Promise<void> {
  await requireAdmin();
  await prisma.courier.update({ where: { courier_id: courierId }, data: { is_active } });
  revalidatePath("/admin/couriers");
}
