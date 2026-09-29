// এই ফাইলটি নেক্সট.জেএস (Next.js) এর "সার্ভার অ্যাকশন" হিসেবে কাজ করবে।
"use server";

// ডাটাবেস আপডেট হওয়ার পর ক্লায়েন্ট-সাইড ক্যাশ (Cache) রিভ্যালিডেট (Revalidate) করার জন্য নেক্সট.জেএস এর ফাংশন।
import { revalidatePath } from "next/cache";
// ডাটাবেসের সাথে সরাসরি যোগাযোগ করার জন্য।
import { db } from "@/lib/db";
// শুধুমাত্র লগ-ইন করা কাস্টমাররাই যেন এই অ্যাকশনগুলো চালাতে পারে, তা নিশ্চিত করার জন্য হেল্পার ফাংশন।
import { requireCustomer } from "@/lib/auth";

// ─── কার্টে প্রোডাক্ট যুক্ত করা (Add to Cart) ──────────────────────────────────────────────
export async function addToCartAction(
  productId: number,
  variantCode: string | null,
  quantity: number = 1
): Promise<{ error?: string; success?: boolean }> {
  // ১. অথেনটিকেশন চেক (Authentication Check): ইউজার লগ-ইন না থাকলে এটি থ্রো (Throw) করবে।
  const session = await requireCustomer();

  // ২. কার্ট লুকআপ (Cart Lookup): ইউজারের কার্ট আইডি খুঁজে বের করা।
  const cartRes = await db.query('SELECT cart_id FROM cart WHERE customer_id = $1', [session.id]);
  if (cartRes.rows.length === 0) return { error: "Cart not found" };
  const cartId = cartRes.rows[0].cart_id;

  // ৩. আপসার্ট লজিক (Upsert Logic - Update or Insert):
  // যদি প্রোডাক্টটির ভ্যারিয়েন্ট (যেমন: সাইজ, কালার) থাকে।
  if (variantCode) {
    // কার্টে আগে থেকেই এই প্রোডাক্ট এবং ভ্যারিয়েন্টটি আছে কি না চেক করা।
    const existing = await db.query(
      'SELECT cart_item_id FROM cart_item WHERE cart_id = $1 AND variant_code = $2',
      [cartId, variantCode]
    );
    if (existing.rows.length > 0) {
      // থাকলে শুধু কোয়ান্টিটি (Quantity) আপডেট করা।
      await db.query(
        'UPDATE cart_item SET quantity = quantity + $1 WHERE cart_item_id = $2',
        [quantity, existing.rows[0].cart_item_id]
      );
    } else {
      // না থাকলে নতুন সারি (Row) হিসেবে ইনসার্ট করা।
      await db.query(
        'INSERT INTO cart_item (cart_id, product_id, variant_code, quantity) VALUES ($1, $2, $3, $4)',
        [cartId, productId, variantCode, quantity]
      );
    }
  } else {
    // প্রোডাক্টটির কোনো ভ্যারিয়েন্ট না থাকলে।
    const existing = await db.query(
      'SELECT cart_item_id FROM cart_item WHERE cart_id = $1 AND product_id = $2 AND variant_code IS NULL',
      [cartId, productId]
    );
    if (existing.rows.length > 0) {
      // কোয়ান্টিটি বৃদ্ধি।
      await db.query(
        'UPDATE cart_item SET quantity = quantity + $1 WHERE cart_item_id = $2',
        [quantity, existing.rows[0].cart_item_id]
      );
    } else {
      // নতুন ইনসার্ট।
      await db.query(
        'INSERT INTO cart_item (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
        [cartId, productId, quantity]
      );
    }
  }

  // ৪. ক্যাশ ইনভ্যালিডেশন (Cache Invalidation):
  // কার্ট এবং হোমপেজের ক্যাশ মুছে ফেলা, যাতে ইউজার লেটেস্ট ডেটা দেখতে পায়।
  revalidatePath("/cart");
  revalidatePath("/");
  return { success: true };
}

// ─── কার্টের আইটেমের সংখ্যা পরিবর্তন করা (Update Cart Item Quantity) ────────────────────────────────
export async function updateCartItemAction(
  cartItemId: number,
  quantity: number
): Promise<{ error?: string }> {
  // সিকিউরিটি চেক: ইউজার লগ-ইন থাকতে হবে।
  await requireCustomer();

  // কোয়ান্টিটি ১ এর নিচে গেলে আইটেমটি কার্ট থেকে মুছে ফেলা হবে।
  if (quantity < 1) {
    await db.query('DELETE FROM cart_item WHERE cart_item_id = $1', [cartItemId]);
  } else {
    // অন্যথায় নির্দিষ্ট কোয়ান্টিটি সেট করা হবে।
    await db.query('UPDATE cart_item SET quantity = $1 WHERE cart_item_id = $2', [quantity, cartItemId]);
  }

  // ক্যাশ আপডেট।
  revalidatePath("/cart");
  return {};
}

// ─── কার্ট থেকে আইটেম মুছে ফেলা (Remove Cart Item) ─────────────────────────────────────────
export async function removeCartItemAction(cartItemId: number): Promise<void> {
  await requireCustomer();
  // ডাটাবেস থেকে আইটেম ডিলিট করা।
  await db.query('DELETE FROM cart_item WHERE cart_item_id = $1', [cartItemId]);
  revalidatePath("/cart");
}

// ─── কুপন ভ্যালিডেশন (Validate Coupon) ──────────────────────────────────────────
// এই ফাংশনটি চেক করে যে কুপন কোডটি বৈধ কি না এবং ডিসকাউন্ট এর পরিমাণ কত।
export async function validateCouponAction(
  code: string,
  subtotal: number
): Promise<{
  valid: boolean;
  discountAmount?: number;
  error?: string;
  coupon?: { code: string; discount_type: string; discount_value: number };
}> {
  // ১. কুপন লুকআপ (Coupon Lookup): কোডটি আপারকেস (Uppercase) করে ডাটাবেসে খোঁজা।
  const couponRes = await db.query('SELECT * FROM coupon WHERE code = $1', [code.toUpperCase()]);

  // কুপন না পেলে বা ইনঅ্যাক্টিভ থাকলে এরর।
  if (couponRes.rows.length === 0 || !couponRes.rows[0].is_active) {
    return { valid: false, error: "Invalid coupon code" };
  }
  
  const coupon = couponRes.rows[0];

  // ২. বিজনেস রুল ভ্যালিডেশন (Business Rule Validation):
  // কুপনের মেয়াদ শেষ হয়ে গেছে কি না।
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    return { valid: false, error: "Coupon has expired" };
  }
  // কুপনের ইউজেস লিমিট (Usage Limit) অতিক্রম করেছে কি না।
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, error: "Coupon usage limit reached" };
  }
  // কার্টের মোট মূল্য কুপনের মিনিমাম স্পেন্ড (Minimum Spend) রিকোয়ারমেন্ট পূর্ণ করে কি না।
  if (subtotal < Number(coupon.min_spend)) {
    return { valid: false, error: `Minimum spend of ৳${Number(coupon.min_spend).toLocaleString()} required` };
  }

  // ৩. ডিসকাউন্ট ক্যালকুলেশন (Discount Calculation):
  let discountAmount = 0;
  if (coupon.discount_type === "percentage") {
    // পারসেন্টেজ ভিত্তিক ডিসকাউন্ট।
    discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
    // যদি সর্বোচ্চ ডিসকাউন্ট (Max Discount) লিমিট থাকে।
    if (coupon.max_discount) {
      discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
    }
  } else {
    // ফিক্সড অ্যামাউন্ট ডিসকাউন্ট।
    discountAmount = Number(coupon.discount_value);
  }

  // ৪. রেসপন্স (Response):
  return {
    valid: true,
    discountAmount,
    coupon: {
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
    },
  };
}

// ─── উইশলিস্টে যুক্ত করা (Add to Wishlist) ──────────────────────────────────────────
export async function addToWishlistAction(
  productId: number,
  variantCode: string | null
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireCustomer();

  // ইউজারের উইশলিস্ট আইডি ফেচ করা।
  const wishlistRes = await db.query('SELECT wishlist_id FROM wishlist WHERE customer_id = $1', [session.id]);
  if (wishlistRes.rows.length === 0) return { error: "Wishlist not found" };
  const wishlistId = wishlistRes.rows[0].wishlist_id;

  // উইশলিস্টে আইটেমটি আগে থেকেই আছে কি না তা যাচাই করা (Idempotency)।
  const existingRes = await db.query(
    'SELECT id FROM wishlist_item WHERE wishlist_id = $1 AND (variant_code = $2 OR (variant_code IS NULL AND $2 IS NULL)) AND product_id = $3',
    [wishlistId, variantCode, productId]
  );
  
  // না থাকলে ইনসার্ট করা।
  if (existingRes.rows.length === 0) {
    await db.query(
      'INSERT INTO wishlist_item (wishlist_id, product_id, variant_code) VALUES ($1, $2, $3)',
      [wishlistId, productId, variantCode]
    );
  }

  // ক্যাশ রিভ্যালিডেট করা।
  revalidatePath("/account/wishlist");
  return { success: true };
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/actions/cart.ts`) ইউজারের শপিং কার্ট (Shopping Cart), কুপন (Coupon) এবং উইশলিস্ট (Wishlist) ম্যানেজমেন্টের জন্য ব্যবহৃত "সার্ভার অ্যাকশন (Server Actions)" এর সমষ্টি। এই ফাংশনগুলো মূলত ই-কমার্সের কোর মিউটেশন (Core Mutations) হিসেবে কাজ করে। প্রতিটি অপারেশন শেষে `revalidatePath` কল করা হয়, যা নেক্সট.জেএস কে নির্দেশ দেয় যেন সে নির্দিষ্ট রাউটের সার্ভার-সাইড ক্যাশ (Server-Side Cache) ইনভ্যালিডেট করে এবং নতুন ডেটা ক্লায়েন্টে পাঠায়।

২. ডাটাবেস ডিজাইন ও আপসার্ট লজিক (Database Design & Upsert Logic):
কার্টে প্রোডাক্ট যোগ করার সময় `addToCartAction` ফাংশনটি একটি "Check and Update/Insert" (Upsert) লজিক অনুসরণ করে। এটি প্রথমে চেক করে যে কার্টে ইতিমধ্যে একই প্রোডাক্ট ও ভ্যারিয়েন্ট (Variant) আছে কি না। থাকলে এটি নতুন সারি তৈরি না করে শুধুমাত্র `quantity` কলামের মান বৃদ্ধি করে। এটি ডেটাবেস নরমালাইজেশন (Normalization) বজায় রাখে এবং কার্ট আইটেমের ডুপ্লিকেশন (Duplication) রোধ করে।

৩. বিজনেস লজিক বাস্তবায়ন (Business Logic Implementation):
`validateCouponAction` ফাংশনটি একটি চমৎকার উদাহরণ যে কীভাবে সার্ভার-সাইডে কমপ্লেক্স বিজনেস রুলস (Business Rules) চেক করতে হয়। এটি ইনপুট কোডটির মেয়াদউত্তীর্ণ তারিখ (Expiry Date), ব্যবহারের সীমা (Usage Limit), এবং ন্যূনতম খরচের (Minimum Spend) শর্তগুলো কঠোরভাবে যাচাই করে। এর ফলে ক্লায়েন্ট-সাইড ম্যানিপুলেশন করে কোনো অবৈধ ডিসকাউন্ট নেওয়ার সুযোগ থাকে না।
================================================================================
*/
