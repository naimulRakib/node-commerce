// এই ফাইলটি নেক্সট.জেএস (Next.js) এর "সার্ভার অ্যাকশন" হিসেবে কাজ করবে।
"use server";

// ডাটাবেস আপডেট হওয়ার পর নির্দিষ্ট পেজের ক্যাশ রিভ্যালিডেট করার ফাংশন।
import { revalidatePath } from "next/cache";
// ডাটাবেসের সাথে সরাসরি যোগাযোগ করার জন্য।
import { db } from "@/lib/db";
// শুধুমাত্র লগ-ইন করা কাস্টমাররাই যেন রিভিউ দিতে পারে, তা নিশ্চিত করার জন্য।
import { requireCustomer } from "@/lib/auth";

// ─── প্রোডাক্ট রিভিউ সাবমিট করা (Submit Review) ────────────────────────────────────────────
// এই ফাংশনটি শুধুমাত্র ভেরিফাইড ক্রেতাদের (যাদের প্রোডাক্ট ডেলিভারি হয়েছে) জন্য `is_verified` ট্যাগ যুক্ত করে।
export async function submitReviewAction(
  productId: number,
  rating: number,
  comment: string
): Promise<{ error?: string; success?: boolean }> {
  // ১. অথেনটিকেশন চেক (Authentication Check)।
  const session = await requireCustomer();

  // ২. ইনপুট ভ্যালিডেশন (Input Validation)।
  if (rating < 1 || rating > 5) return { error: "Rating must be between 1 and 5" };

  // ৩. পারচেজ ভেরিফিকেশন (Purchase Verification):
  // চেক করা হচ্ছে যে এই কাস্টমার কখনো এই প্রোডাক্টটি অর্ডার করেছে কি না এবং সেই অর্ডারের স্ট্যাটাস 'delivered' কি না।
  const purchasedRes = await db.query(`
    SELECT i.order_item_id
    FROM order_item i
    JOIN customer_order o ON i.order_id = o.order_id
    WHERE i.product_id = $1 AND o.customer_id = $2 AND o.status = $3
    LIMIT 1
  `, [productId, session.id, 'delivered']);
  // যদি কোনো রেকর্ড পাওয়া যায়, তার মানে ইউজার ভেরিফাইড বায়ার (Verified Buyer)।
  const isVerified = purchasedRes.rows.length > 0;

  // ৪. ডুপ্লিকেট রিভিউ চেক (Duplicate Review Check):
  // একজন ইউজার একটি প্রোডাক্টে কেবল একবারই রিভিউ দিতে পারবে।
  const existingRes = await db.query(
    'SELECT review_id FROM review WHERE product_id = $1 AND customer_id = $2',
    [productId, session.id]
  );
  if (existingRes.rows.length > 0) return { error: "You have already reviewed this product" };

  // ৫. ডাটাবেস ইনসার্ট (Database Insert):
  await db.query(`
    INSERT INTO review (product_id, customer_id, rating, comment, is_verified)
    VALUES ($1, $2, $3, $4, $5)
  `, [productId, session.id, rating, comment.trim() || null, isVerified]);

  // ৬. ক্যাশ রিভ্যালিডেশন (Cache Revalidation):
  // প্রোডাক্ট ডিটেইলস পেজের ক্যাশ ক্লিয়ার করা যাতে নতুন রিভিউটি সাথে সাথেই ওয়েবসাইটে দেখায়।
  revalidatePath(`/products/${productId}`);
  return { success: true };
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/actions/review.ts`) কাস্টমারদের প্রোডাক্ট রিভিউ (Product Reviews) গ্রহণের জন্য ব্যবহৃত সার্ভার অ্যাকশন। এটি ইউজার-জেনারেটেড কন্টেন্ট (UGC) সাবমিশন প্রক্রিয়া নিয়ন্ত্রণ করে এবং ফেক রিভিউ (Fake Reviews) বা স্প্যাম রোধ করার জন্য ডাটাবেস লেভেলে কিছু গুরুত্বপূর্ণ চেক (Checks) সম্পাদন করে।

২. ভেরিফাইড পারচেজ লজিক (Verified Purchase Logic):
এই এপিআইটির সবচেয়ে শক্তিশালী দিক হলো এর "ভেরিফাইড পারচেজ" মেকানিজম। রিভিউ ডাটাবেসে সেভ করার আগে এটি `order_item` এবং `customer_order` টেবিলের সাথে জয়েন (JOIN) কুয়েরি করে যাচাই করে যে ইউজার সত্যিই এই প্রোডাক্টটি কিনেছে কি না এবং তার ডেলিভারি স্ট্যাটাস `delivered` কি না। যদি ম্যাচ করে, তবে ডাটাবেসে রিভিউ এর `is_verified` কলামটি `true` হিসেবে সেট হয়, যা ইউআই (UI) তে "Verified Buyer" ব্যাজ হিসেবে দেখানো যেতে পারে।

৩. ডেটা ইন্টেগ্রিটি (Data Integrity):
একজন ইউজার একটি প্রোডাক্টে একাধিক রিভিউ দিয়ে যাতে রেটিং ম্যানিপুলেট করতে না পারে, সেজন্য রিভিউ সেভ করার আগে একটি `SELECT` কুয়েরি দিয়ে চেক করা হয় যে ঐ `product_id` এবং `customer_id` এর কম্বিনেশনে আগে কোনো রিভিউ আছে কি না। এটি ফেক রেটিং স্প্যামিং (Rating Spamming) প্রতিরোধ করে।
================================================================================
*/
