// "use server" নির্দেশিকা (Directive) ব্যবহার করে নেক্সট.জেএস (Next.js) কে জানানো হচ্ছে যে 
// এই ফাইলের সকল ফাংশন শুধুমাত্র সার্ভার-সাইডে (Server-side) এক্সিকিউট (Execute) হবে (Server Actions)।
"use server";

// ক্লায়েন্টকে অন্য রাউটে (Route) রিডাইরেক্ট (Redirect) করার জন্য।
import { redirect } from "next/navigation";
// নির্দিষ্ট পাথের (Path) ক্যাশ (Cache) ইনভ্যালিডেট (Invalidate) বা রিভ্যালিডেট (Revalidate) করার জন্য।
import { revalidatePath } from "next/cache";
// সরাসরি ডেটাবেস কুয়েরি চালানোর জন্য `db` এবং ট্রানজ্যাকশনের জন্য `pool` ইমপোর্ট করা হচ্ছে।
import { db, pool } from "@/lib/db";
// শুধুমাত্র প্রমাণীকৃত গ্রাহকদের (Authenticated Customers) জন্য অ্যাক্সেস কন্ট্রোল (Access Control) গার্ড।
import { requireCustomer } from "@/lib/auth";
// জটিল ট্রানজ্যাকশনাল লজিকগুলো (Transactional Logic) ইমপোর্ট করা হচ্ছে।
import { placeOrder, cancelOrder } from "@/lib/transactions";

// ─── অর্ডার প্লেস করা (Place Order) ──────────────────────────────────────────────
// ফর্ম ডেটা (FormData) গ্রহণ করে একটি নতুন অর্ডার প্রসেস করার সার্ভার অ্যাকশন।
export async function placeOrderAction(formData: FormData): Promise<{ error?: string }> {
  // ১. অ্যাক্সেস কন্ট্রোল: রিকোয়েস্টকারী ব্যবহারকারী লগ-ইন করা গ্রাহক কিনা তা যাচাই (Verify) করা হচ্ছে।
  // [CHECKLIST REQUIREMENT 2]: Authentication Validation on Every Page
  const session = await requireCustomer();

  // ২. ফর্ম ডেটা এক্সট্রাকশন (Extraction) এবং টাইপ কাস্টিং (Type Casting):
  const shippingAddressId = Number(formData.get("shippingAddressId"));
  const courierId = formData.get("courierId") ? Number(formData.get("courierId")) : undefined;
  const couponCode = (formData.get("couponCode") as string) || undefined;
  const paymentMethod = (formData.get("paymentMethod") as string) || "cod";

  // ৩. ইনপুট ভ্যালিডেশন (Input Validation): শিপিং অ্যাড্রেস বাধ্যতামূলক।
  if (!shippingAddressId) return { error: "Please select a shipping address" };

  // ৪. বিজনেস লজিক ইনভোকেশন (Business Logic Invocation): ট্রানজ্যাকশন মডিউলে ডেটা পাঠানো হচ্ছে।
  const result = await placeOrder({
    customerId: session.id,
    shippingAddressId,
    courierId,
    couponCode,
    paymentMethod,
  });

  // ৫. ত্রুটি পরিচালনা (Error Handling): ট্রানজ্যাকশন ব্যর্থ হলে ত্রুটি বার্তা ফেরত দেওয়া হচ্ছে।
  if (!result.success) return { error: result.error };

  // ৬. সফলতার পর (Success Path): ব্যবহারকারীকে অর্ডার কনফার্মেশন (Confirmation) পৃষ্ঠায় রিডাইরেক্ট করা হচ্ছে।
  redirect(`/checkout/confirmation/${result.orderId}`);
}

// ─── অর্ডার বাতিল করা (Cancel Order - Customer) ──────────────────────────────────
// গ্রাহকের দ্বারা তার নিজের অর্ডার বাতিল করার সার্ভার অ্যাকশন।
export async function cancelOrderAction(orderId: number): Promise<{ error?: string }> {
  const session = await requireCustomer();

  // ১. অনুমোদন যাচাই (Authorization Check): অর্ডারটি সত্যিই এই গ্রাহকের কি না তা ডাটাবেস থেকে নিশ্চিত করা হচ্ছে (IDOR Vulnerability প্রশমন)।
  const orderRes = await db.query(
    'SELECT order_id FROM customer_order WHERE order_id = $1 AND customer_id = $2',
    [orderId, session.id]
  );
  if (orderRes.rows.length === 0) return { error: "Order not found" };

  // ২. বিজনেস লজিক ইনভোকেশন: ট্রানজ্যাকশনাল ক্যান্সেল প্রক্রিয়া কল করা হচ্ছে।
  const result = await cancelOrder(orderId, session.id);
  if (!result.success) return { error: result.error };

  // ৩. ক্যাশ রিভ্যালিডেশন (Cache Revalidation): অর্ডার লিস্ট এবং ডিটেইল পেজের ক্যাশ মুছে ফেলা হচ্ছে 
  // যাতে গ্রাহক রিফ্রেশ ছাড়াই লেটেস্ট স্ট্যাটাস দেখতে পায়।
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  return {};
}

// ─── রিটার্ন রিকোয়েস্ট (Request Return) ───────────────────────────────────────────
// ডেলিভারি সম্পন্ন হওয়ার পর কোনো পণ্যের রিটার্ন (Return) রিকোয়েস্ট তৈরি করার সার্ভার অ্যাকশন।
export async function requestReturnAction(
  orderId: number,
  productId: number,
  reason: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireCustomer();

  // ১. অনুমোদন ও স্ট্যাটাস যাচাই (State Verification): অর্ডারটি গ্রাহকের কিনা এবং তা 'delivered' অবস্থায় আছে কিনা তা যাচাই করা।
  const orderRes = await db.query(
    'SELECT order_id FROM customer_order WHERE order_id = $1 AND customer_id = $2 AND status = $3',
    [orderId, session.id, 'delivered']
  );
  if (orderRes.rows.length === 0) return { error: "Order not found or not eligible for return" };

  // ২. অর্ডার আইটেম শনাক্তকরণ (Item Identification): 'return_request' টেবিলে রেফারেন্সের জন্য নির্দিষ্ট 'order_item_id' খুঁজে বের করা।
  const itemRes = await db.query(
    'SELECT order_item_id FROM order_item WHERE order_id = $1 AND product_id = $2 LIMIT 1',
    [orderId, productId]
  );
  if (itemRes.rows.length === 0) return { error: "Product not in this order" };

  // ৩. ডেটাবেস ইনসার্ট (Database Insert): রিটার্ন রিকোয়েস্টটি সেভ করা হচ্ছে।
  await db.query(
    'INSERT INTO return_request (order_item_id, reason, status) VALUES ($1, $2, $3)',
    [itemRes.rows[0].order_item_id, reason, 'requested']
  );

  // ৪. ক্যাশ রিভ্যালিডেশন।
  revalidatePath(`/account/orders/${orderId}`);
  return { success: true };
}

// ─── নতুন ঠিকানা যুক্ত করা (Add Address) ──────────────────────────────────────────────
// গ্রাহকের অ্যাড্রেস বুকে (Address Book) নতুন ঠিকানা যোগ করার সার্ভার অ্যাকশন।
export async function addAddressAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireCustomer();

  // ১. ফর্ম ডেটা এক্সট্রাকশন (Form Data Extraction):
  const label = (formData.get("label") as string) || "home";
  const address_line1 = formData.get("address_line1") as string;
  const address_line2 = (formData.get("address_line2") as string) || undefined;
  const city = formData.get("city") as string;
  const district = (formData.get("district") as string) || undefined;
  const postal_code = (formData.get("postal_code") as string) || undefined;
  const is_default = formData.get("is_default") === "on";

  // ২. ইনপুট ভ্যালিডেশন: অত্যাবশ্যকীয় ফিল্ডগুলো যাচাই করা।
  if (!address_line1 || !city) return { error: "Address line 1 and city are required" };

  // ৩. ট্রানজ্যাকশন শুরু: ডেডিকেটেড ক্লায়েন্ট ধার (Checkout) করা হচ্ছে।
  const client = await pool.connect();
  try {
    // [CHECKLIST REQUIREMENT 3]: Explicit Transaction Control (BEGIN)
    await client.query("BEGIN");
    
    // ৪. লজিক: যদি নতুন ঠিকানাটিকে ডিফল্ট (Default) হিসেবে মার্ক করা হয়, 
    // তবে পূর্বের সকল ঠিকানার 'is_default' স্ট্যাটাস 'false' করে দেওয়া হয় (Consistency)।
    if (is_default) {
      await client.query(
        'UPDATE address SET is_default = false WHERE customer_id = $1',
        [session.id]
      );
    }
    
    // ৫. নতুন ডেটা ইনসার্ট করা হচ্ছে।
    await client.query(
      `INSERT INTO address (customer_id, label, address_line1, address_line2, city, district, postal_code, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [session.id, label, address_line1, address_line2, city, district, postal_code, is_default]
    );
    
    // ৬. সফল হলে কমিট (COMMIT)।
    // [CHECKLIST REQUIREMENT 3]: Explicit Transaction Control (COMMIT)
    await client.query("COMMIT");
  } catch (error) {
    // ত্রুটি হলে রোলব্যাক (ROLLBACK)।
    // [CHECKLIST REQUIREMENT 3]: Explicit Transaction Control (ROLLBACK)
    await client.query("ROLLBACK");
    console.error("[addAddressAction] Transaction failed:", error);
    return { error: "Failed to add address" };
  } finally {
    // ৭. কানেকশন রিলিজ (Release Connection)।
    client.release();
  }

  // ৮. ক্যাশ রিভ্যালিডেশন: প্রোফাইল এবং চেকআউট পেজের ক্যাশ ক্লিন করা হচ্ছে।
  revalidatePath("/account/profile");
  revalidatePath("/checkout");
  return {};
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/actions/order.ts`) নেক্সট.জেএস (Next.js) এর "Server Actions" প্যাটার্ন ব্যবহার করে তৈরি করা হয়েছে। এটি মূলত কন্ট্রোলার (Controller) লেয়ার হিসেবে কাজ করে, যা ফ্রন্টএন্ড (Client-side) এবং ব্যাকএন্ড বিজনেস লজিক (Transaction Module) এর মধ্যে একটি সেতুবন্ধন তৈরি করে। এখানে ফর্ম ডেটা (FormData) প্রসেসিং, ডেটা ভ্যালিডেশন (Validation) এবং টাইপ কাস্টিং সম্পন্ন হয়। প্রতিটি অ্যাকশনের শেষে `revalidatePath` কল করা হয়, যা নেক্সট.জেএস এর ডাটা ফেচিং আর্কিটেকচারের (Data Fetching Architecture) একটি গুরুত্বপূর্ণ অংশ; এটি ক্যাশড (Cached) পেজগুলোকে ইনভ্যালিডেট করে অন-ডিমান্ড ইনক্রিমেন্টাল স্ট্যাটিক রিজেনারেশন (On-demand ISR) ট্রিগার করে।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এই ফাইলে কঠোর অ্যাক্সেস কন্ট্রোল (Strict Access Control) বাস্তবায়িত হয়েছে। প্রতিটি ফাংশনের শুরুতেই `requireCustomer()` ইনভোক করা হয়, যা গ্যারান্টি দেয় যে শুধুমাত্র লগ-ইন করা গ্রাহকরাই এই অ্যাকশনগুলো ট্রিগার করতে পারবেন। 
ইনসিকিউর ডাইরেক্ট অবজেক্ট রেফারেন্স (Insecure Direct Object Reference - IDOR) ঠেকানোর জন্য `cancelOrderAction` এবং `requestReturnAction` এ ডেটাবেস লেভেলে চেক করা হয়েছে যে, প্রদত্ত `orderId` আসলেই কারেন্ট সেশনের `customer_id` এর সাথে সম্পর্কিত কিনা। এটি মাল্টি-ট্যানেন্ট (Multi-tenant) ডেটা আইসোলেশনের (Data Isolation) একটি চমৎকার উদাহরণ।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
সার্ভার অ্যাকশনগুলো মূলত ক্লায়েন্ট থেকে রিমোট প্রসিডিউর কল (RPC - Remote Procedure Call) হিসেবে কাজ করে। ক্লায়েন্টের ফর্ম সাবমিশন বা বাটন ক্লিক থেকে HTTP POST রিকোয়েস্টের মাধ্যমে পে-লোড (Payload) এখানে আসে। এরপর এটি ডেটাবেস অপারেশন (ট্রানজ্যাকশন মডিউল বা সরাসরি `db.query`) সম্পন্ন করে। ডেটা প্রবাহ একমুখী (Unidirectional) নয়, বরং অপারেশন শেষে এটি হয় নেভিগেশনের জন্য `redirect` পাঠায় অথবা স্টেট আপডেটের জন্য পেজ রিভ্যালিডেট (Revalidate) করে ক্লায়েন্টকে রেসপন্স (Response) প্রদান করে।
================================================================================
*/
