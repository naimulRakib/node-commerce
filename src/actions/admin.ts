// "use server" নির্দেশিকা (Directive) ব্যবহার করে নেক্সট.জেএস (Next.js) কে জানানো হচ্ছে যে 
// এই ফাইলের সকল ফাংশন শুধুমাত্র সার্ভার-সাইডে এক্সিকিউট হবে (Server Actions)।
"use server";

// ক্লায়েন্টকে অন্য রাউটে (Route) নেভিগেট বা রিডাইরেক্ট (Redirect) করার জন্য।
import { redirect } from "next/navigation";
// অন-ডিমান্ড ইনক্রিমেন্টাল স্ট্যাটিক রিজেনারেশন (On-demand ISR) ট্রিগার করে ক্যাশ মুছে ফেলার জন্য।
import { revalidatePath } from "next/cache";
// পাসওয়ার্ড হ্যাশিং এবং ভেরিফিকেশনের জন্য 'bcryptjs' ক্রিপ্টোগ্রাফিক লাইব্রেরি।
import bcrypt from "bcryptjs";
// ডাটাবেসের সাথে ইন্টারঅ্যাক্ট করার জন্য।
import { db } from "@/lib/db";
// সেশন ম্যানেজমেন্ট এবং কুকি (Cookie) নিয়ন্ত্রণের জন্য কাস্টম অথ ফাংশন।
import { createSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";
// শুধুমাত্র অ্যাডমিনদের জন্য অ্যাক্সেস কন্ট্রোল (Access Control) এনফোর্স করার ফাংশন।
import { requireAdmin } from "@/lib/auth";
// অর্ডার স্ট্যাটাস আপডেট করার জটিল ট্রানজ্যাকশন লজিক।
import { updateOrderStatus } from "@/lib/transactions";
// সিস্টেমের অডিট ট্রেইল (Audit Trail) মেইনটেইন করার জন্য।
import { logAudit } from "@/lib/audit";

// ─── অ্যাডমিন লগইন (Admin Login) ──────────────────────────────────────────────
export async function adminLoginAction(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // ১. ইনপুট ভ্যালিডেশন (Input Validation)
  if (!email || !password) return { error: "Email and password are required" };

  // ২. ডাটাবেস লুকআপ (Database Lookup): ইমেইল দিয়ে অ্যাডমিন ইউজার খোঁজা হচ্ছে।
  // 'admin' টেবিল থেকে ইমেইল দিয়ে অ্যাডমিন খোঁজা হচ্ছে। (customer টেবিল নয়!)
  const res = await db.query('SELECT * FROM admin WHERE email = $1', [email.trim().toLowerCase()]);
  const admin = res.rows[0];
  
  // ৩. অস্তিত্ব এবং স্ট্যাটাস যাচাই (Existence & Status Check)
  if (!admin || !admin.is_active) return { error: "Invalid credentials" };

  // ৪. পাসওয়ার্ড ভেরিফিকেশন (Password Verification): 
  // 'bcrypt.compare' ব্যবহার করে হ্যাশড পাসওয়ার্ডের সাথে প্লেইন টেক্সট পাসওয়ার্ড মেলানো হচ্ছে। 
  // এটি টাইমিং অ্যাটাক (Timing Attack) থেকে সুরক্ষিত।
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return { error: "Invalid credentials" };

  // ৫. সেশন ক্রিয়েশন (Session Creation): JWT টোকেন জেনারেট করা হচ্ছে।
  const token = await createSession({
    id: admin.admin_id,
    email: admin.email,
    name: admin.name,
    role: admin.role as "admin" | "super_admin", // টাইপ কাস্টিং
  });
  
  // ৬. কুকি সেট করা (Setting HTTP-only Cookie)
  await setSessionCookie(token);
  // ৭. রিডাইরেক্ট (Redirect) ড্যাশবোর্ডে
  redirect("/admin");
}

// ─── অ্যাডমিন লগআউট (Admin Logout) ─────────────────────────────────────────────
export async function adminLogoutAction() {
  // কুকি ক্লিয়ার করে সেশন ধ্বংস (Destroy Session) করা হচ্ছে।
  await clearSessionCookie();
  redirect("/admin/login");
}

// ─── অর্ডার কনফার্ম করা (Confirm Order) ────────────────────────────────────────────
export async function confirmOrderAction(orderId: number): Promise<{ error?: string }> {
  // ১. অ্যাক্সেস কন্ট্রোল: রিকোয়েস্টকারী বৈধ অ্যাডমিন কিনা যাচাই।
  const admin = await requireAdmin();
  console.log("[DEBUG] confirmOrderAction called for orderId:", orderId, "by admin:", admin.id);
  
  // ২. ট্রানজ্যাকশন কল (Transaction Call): ডাটাবেসে স্ট্যাটাস আপডেট করা।
  const result = await updateOrderStatus(orderId, "confirmed", admin.id);
  console.log("[DEBUG] updateOrderStatus result:", result);
  if (!result.success) return { error: result.error };

  // ৩. কাস্টমার নোটিফিকেশন (Customer Notification): 
  const orderRes = await db.query('SELECT customer_id FROM customer_order WHERE order_id = $1', [orderId]);
  const order = orderRes.rows[0];
  if (order) {
    await db.query(
      'INSERT INTO notification (customer_id, type, message) VALUES ($1, $2, $3)',
      [order.customer_id, "order_update", `Your order #${orderId} has been confirmed and is being processed.`]
    );
  }

  // ৪. ক্যাশ রিভ্যালিডেশন
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

// ─── কুরিয়ার অ্যাসাইন করা (Assign Courier) ───────────────────────────────────────────
export async function assignCourierAction(
  orderId: number,
  courierId: number
): Promise<{ error?: string }> {
  const admin = await requireAdmin();

  // ১. অর্ডারের বর্তমান অবস্থা ফেচ করা
  const orderRes = await db.query('SELECT courier_id FROM customer_order WHERE order_id = $1', [orderId]);
  const order = orderRes.rows[0];
  if (!order) return { error: "Order not found" };

  const oldCourier = order.courier_id;
  // ২. কুরিয়ার আপডেট (Update Courier)
  await db.query('UPDATE customer_order SET courier_id = $1 WHERE order_id = $2', [courierId, orderId]);

  // ৩. অডিট লগিং (Audit Logging): 
  // অ্যাডমিন কী পরিবর্তন করেছে তা সিস্টেমে রেকর্ড করা হচ্ছে (Accountability)।
  await logAudit("customer_order", orderId, "UPDATE", admin.id,
    { courier_id: oldCourier },
    { courier_id: courierId }
  );

  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}

// ─── কুরিয়ার অ্যাপ্রুভ / প্রসেসিং এ পাঠানো (Approve Courier) ────────────────────
export async function approveCourierAction(orderId: number): Promise<{ error?: string }> {
  const admin = await requireAdmin();

  // ১. স্টেট চেকিং (State Checking):
  const orderRes = await db.query('SELECT courier_id, status FROM customer_order WHERE order_id = $1', [orderId]);
  const order = orderRes.rows[0];
  if (!order) return { error: "Order not found" };
  // প্রি-রিকুইজিট (Prerequisite): কুরিয়ার অ্যাসাইন করা থাকতে হবে এবং স্ট্যাটাস 'confirmed' হতে হবে।
  if (!order.courier_id) return { error: "Please assign a courier first" };
  if (order.status !== "confirmed") return { error: "Order must be confirmed before approving courier" };

  // ২. স্ট্যাটাস আপডেট 
  const result = await updateOrderStatus(orderId, "processing", admin.id, order.courier_id);
  if (!result.success) return { error: result.error };

  // ৩. নোটিফিকেশন
  const customerRes = await db.query('SELECT customer_id FROM customer_order WHERE order_id = $1', [orderId]);
  const customer = customerRes.rows[0];
  if (customer) {
    await db.query(
      'INSERT INTO notification (customer_id, type, message) VALUES ($1, $2, $3)',
      [customer.customer_id, "order_update", `Your order #${orderId} is being prepared for shipment.`]
    );
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

// ─── শিপড মার্ক করা (Mark Shipped) ─────────────────────────────────────────────
export async function markShippedAction(orderId: number): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const result = await updateOrderStatus(orderId, "shipped", admin.id);
  if (!result.success) return { error: result.error };

  const orderRes = await db.query('SELECT customer_id FROM customer_order WHERE order_id = $1', [orderId]);
  const order = orderRes.rows[0];
  if (order) {
    await db.query(
      'INSERT INTO notification (customer_id, type, message) VALUES ($1, $2, $3)',
      [order.customer_id, "order_update", `Your order #${orderId} has been shipped and is on its way!`]
    );
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

// ─── ডেলিভার্ড মার্ক করা (Mark Delivered) ───────────────────────────────────────────
export async function markDeliveredAction(orderId: number): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const result = await updateOrderStatus(orderId, "delivered", admin.id);
  if (!result.success) return { error: result.error };

  const orderRes = await db.query('SELECT customer_id FROM customer_order WHERE order_id = $1', [orderId]);
  const order = orderRes.rows[0];
  if (order) {
    await db.query(
      'INSERT INTO notification (customer_id, type, message) VALUES ($1, $2, $3)',
      [order.customer_id, "order_update", `Your order #${orderId} has been delivered. Enjoy your purchase!`]
    );
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

// ─── নতুন প্রোডাক্ট তৈরি করা (Create Product) ───────────────────────────────────────────
export async function createProductAction(formData: FormData): Promise<{ error?: string; productId?: number }> {
  await requireAdmin();

  // ১. ডেটা এক্সট্রাকশন
  const name = formData.get("name") as string;
  const product_code = formData.get("product_code") as string;
  const description = formData.get("description") as string;
  const base_price = Number(formData.get("base_price"));
  const category_id = formData.get("category_id") ? Number(formData.get("category_id")) : undefined;
  const image_url = formData.get("image_url") as string;

  // ২. ইনপুট ভ্যালিডেশন
  if (!name || !product_code || !base_price) {
    return { error: "Name, product code, and price are required" };
  }

  try {
    // ৩. ডেটাবেস ইনসার্ট (Database Insert) এবং `RETURNING` ক্লজ ব্যবহার করে নতুন আইডি (ID) নিয়ে আসা।
    const res = await db.query(
      'INSERT INTO product (name, product_code, description, base_price, price, category_id, image_url) VALUES ($1, $2, $3, $4, $4, $5, $6) RETURNING product_id',
      [name, product_code, description || null, base_price, category_id || null, image_url || null]
    );
    const product = res.rows[0];
    
    // ৪. ক্যাশ রিভ্যালিডেশন
    revalidatePath("/admin/products");
    return { productId: product.product_id };
  } catch {
    // 'product_code' ইউনিক হওয়ায় কনফ্লিক্ট (Conflict/Duplicate Key Error) হলে এই ব্লকে আসবে।
    return { error: "Product code already exists or creation failed" };
  }
}

// ─── প্রোডাক্ট আপডেট করা (Update Product) ───────────────────────────────────────────
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
  
  const stock_qty = Number(formData.get("stock_qty") || 0);

  try {
    // ডেটাবেস মিউটেশন (Mutation)
    await db.query(
      'UPDATE product SET name = $1, description = $2, base_price = $3, is_active = $4, category_id = $5, stock_qty = $6, updated_at = NOW() WHERE product_id = $7',
      [name, description || null, base_price, is_active, category_id || null, stock_qty, productId]
    );

    // ভ্যারিয়েন্ট স্টক আপডেট (Variant Stock Updates)
    const variantUpdates: Promise<any>[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith("variant_qty_")) {
        const variantCode = key.replace("variant_qty_", "");
        const qty = Number(value);
        variantUpdates.push(
          db.query('UPDATE product_variant SET quantity = $1 WHERE product_id = $2 AND variant_code = $3', [qty, productId, variantCode])
        );
      }
    });

    if (variantUpdates.length > 0) {
      await Promise.all(variantUpdates);
    }
  } catch (error) {
    console.error("Failed to update product:", error);
    return { error: "Failed to update product" };
  }

  // একাধিক পেজের ক্যাশ ইনভ্যালিডেট করা হচ্ছে।
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/products");
  // সেভ সফল হলে একই পেজে ফিরে যাওয়া (refresh effect)
  redirect(`/admin/products/${productId}/edit`);
}

// ─── কুপন তৈরি করা (Create Coupon) ────────────────────────────────────────────
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
    await db.query(
      'INSERT INTO coupon (code, discount_type, discount_value, min_spend, max_discount, expiry_date, usage_limit, discount_pt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [code, discount_type, discount_value, min_spend, max_discount || null, expiry_date || null, usage_limit || null, discount_type === 'percentage' ? discount_value : 0]
    );
    revalidatePath("/admin/coupons");
    return {};
  } catch {
    return { error: "Coupon code already exists" };
  }
}

// ─── কুপনের স্ট্যাটাস টগল (Toggle) করা ─────────────────────────────────────
export async function toggleCouponAction(code: string, is_active: boolean): Promise<void> {
  await requireAdmin();
  await db.query('UPDATE coupon SET is_active = $1 WHERE code = $2', [is_active, code]);
  revalidatePath("/admin/coupons");
}

// ─── কুরিয়ার তৈরি করা (Create Courier) ───────────────────────────────────────────
export async function createCourierAction(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;

  if (!name) return { error: "Courier name is required" };

  await db.query('INSERT INTO courier (name, phone, email) VALUES ($1, $2, $3)', [name, phone || null, email || null]);
  revalidatePath("/admin/couriers");
  return {};
}

// ─── কুরিয়ারের স্ট্যাটাস টগল (Toggle) করা ────────────────────────────────────
export async function toggleCourierAction(courierId: number, is_active: boolean): Promise<void> {
  await requireAdmin();
  await db.query('UPDATE courier SET is_active = $1 WHERE courier_id = $2', [is_active, courierId]);
  revalidatePath("/admin/couriers");
}

// ─── নতুন ক্যাটাগরি তৈরি করা (Create Category) ────────────────────────────────
export async function createCategoryAction(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const parent_id = formData.get("parent_category_id");

  // ইনপুট ভ্যালিডেশন
  if (!name) return { error: "Category name is required" };

  try {
    if (parent_id) {
      // সাব-ক্যাটাগরি (Sub-category): parent সহ ইনসার্ট করা
      await db.query(
        'INSERT INTO category (name, parent_category_id) VALUES ($1, $2)',
        [name, Number(parent_id)]
      );
    } else {
      // টপ-লেভেল ক্যাটাগরি (Top-level category)
      await db.query('INSERT INTO category (name) VALUES ($1)', [name]);
    }
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return {};
  } catch {
    return { error: "Failed to create category. Name may already exist." };
  }
}

// ─── ক্যাটাগরি ডিলেট করা (Delete Category) ──────────────────────────────────
// শুধুমাত্র খালি ক্যাটাগরি (কোনো প্রোডাক্ট নেই) ডিলেট করা যাবে
export async function deleteCategoryAction(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();

  const categoryId = Number(formData.get("category_id"));
  if (!categoryId) return { error: "Invalid category ID" };

  // ডিলেট করার আগে চেক করা — কোনো প্রোডাক্ট আছে কিনা
  const check = await db.query(
    'SELECT COUNT(*) FROM product WHERE category_id = $1',
    [categoryId]
  );
  const count = Number(check.rows[0].count);
  if (count > 0) {
    return { error: "Cannot delete category with products" };
  }

  await db.query('DELETE FROM category WHERE category_id = $1', [categoryId]);
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return {};
}


/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/actions/admin.ts`) ই-কমার্স সিস্টেমের ব্যাকঅফিস বা অ্যাডমিন প্যানেলের (Admin Panel) সকল মিউটেশনাল লজিক (Mutational Logic) ধারণ করে। 

এটি মূলত একটি রিমোট প্রসিডিউর কল (RPC - Remote Procedure Call) কন্ট্রোলার, যা ফ্রন্টএন্ড ফর্ম বা বাটন ক্লিক থেকে কল হয়। 
এখানে অ্যাডমিন লগইন, অর্ডার স্টেট মেশিন ম্যানেজমেন্ট (State Machine Management - e.g., Confirmed -> Processing -> Shipped -> Delivered), প্রোডাক্ট ক্রিয়েশন, এবং কুপন/কুরিয়ার কনফিগারেশন এর মতো মডিউলগুলো বাস্তবায়িত হয়েছে। 
ডেটাবেস অপারেশনের পর `revalidatePath` কল করার মাধ্যমে ফ্রন্টএন্ডের স্ট্যাটিক/ক্যাশড (Cached) পেজগুলোকে রিয়েল-টাইমে (Real-time) আপডেট করা হয়।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
অ্যাডমিন প্যানেলের নিরাপত্তা সর্বোচ্চ পর্যায়ের। 
- লগইনের ক্ষেত্রে পাসওয়ার্ড হ্যাশিং (Password Hashing) এর জন্য `bcryptjs` ব্যবহার করা হয়েছে যা টাইমিং অ্যাটাক রোধ করে।
- প্রতিটি ফাংশনের শুরুতেই `requireAdmin()` ইনভোক করা হয়েছে, যা কঠোর রোল-ভিত্তিক অ্যাক্সেস কন্ট্রোল (RBAC - Role-Based Access Control) এনফোর্স করে। 
- ডেটাবেসের সকল কুয়েরিতে প্যারামিটারাইজড স্টেটমেন্ট (Parameterized Statements - `$1, $2`) ব্যবহার করায় এসকিউএল ইনজেকশন (SQL Injection) সম্পূর্ণভাবে অসম্ভব। 
- অত্যন্ত ক্রিটিকাল অপারেশন, যেমন 'কুরিয়ার অ্যাসাইন' করার সময়, `logAudit` ফাংশনের মাধ্যমে অডিট ট্রেইল (Audit Trail) রেকর্ড করা হয়, যা সিস্টেমের অ্যাকাউন্টিবিলিটি (Accountability) এবং নন-রেপুডিয়েশন (Non-repudiation) নিশ্চিত করে।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই সার্ভার অ্যাকশনগুলো সরাসরি HTTP POST রিকোয়েস্টের মাধ্যমে পে-লোড গ্রহণ করে। অনেক ক্ষেত্রে ডেটাবেস অপারেশনটি একাধিক ধাপে বিভক্ত। উদাহরণস্বরূপ, অর্ডার কনফার্ম করার সময় প্রথমে `updateOrderStatus` ট্রানজ্যাকশন কল করা হয়, এবং সফল হলে কাস্টমারকে জানানোর জন্য `notification` টেবিলে একটি এন্ট্রি ইনসার্ট করা হয়। এই ধরনের ক্রস-মডিউল (Cross-module) কমিউনিকেশন একটি শক্তিশালী ইভেন্ট-ড্রিভেন আর্কিটেকচারের (Event-driven Architecture) সূচনা নির্দেশ করে।
================================================================================
*/
