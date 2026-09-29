// এই ফাইলটি নেক্সট.জেএস (Next.js) এর "সার্ভার অ্যাকশন" হিসেবে কাজ করবে।
"use server";

// ডাটাবেস আপডেট হওয়ার পর ক্লায়েন্ট-সাইড ক্যাশ রিভ্যালিডেট (Revalidate) করার ফাংশন।
import { revalidatePath } from "next/cache";
// ডাটাবেস পুল এবং কানেকশন অবজেক্ট।
import { pool, db } from "@/lib/db";
// শুধুমাত্র লগ-ইন করা কাস্টমাররাই যেন এই অ্যাকশনগুলো চালাতে পারে, তার হেল্পার ফাংশন।
import { requireCustomer } from "@/lib/auth";

// ─── প্রোফাইল আপডেট করা (Update Profile) ───────────────────────────────────────────
// ইউজারের নাম, লিঙ্গ, জন্মতারিখ এবং ফোন নম্বর আপডেট করার জন্য।
export async function updateProfileAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  // ১. অথেনটিকেশন চেক (Authentication Check)।
  const session = await requireCustomer();

  // ২. ফর্ম ডেটা এক্সট্রাকশন (Form Data Extraction)।
  const full_name = formData.get("full_name") as string;
  const gender = (formData.get("gender") as string) || null;
  const date_of_birth = formData.get("date_of_birth")
    ? new Date(formData.get("date_of_birth") as string)
    : null;
  const phone = (formData.get("phone") as string) || null;

  // ৩. ডাটাবেস ট্রানজেকশন (Database Transaction):
  // যেহেতু `profile` এবং `customer` দুটি আলাদা টেবিলে আপডেট করতে হবে, তাই ট্রানজেকশন ব্যবহার করা জরুরি।
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // ট্রানজেকশন শুরু।
    
    // 3a. Profile টেবিল আপডেট।
    await client.query(
      'UPDATE profile SET full_name = $1, gender = $2, date_of_birth = $3, updated_at = NOW() WHERE customer_id = $4',
      [full_name, gender, date_of_birth, session.id]
    );
    
    // 3b. Customer টেবিল আপডেট (ফোন নম্বর)।
    await client.query(
      'UPDATE customer SET phone = $1 WHERE customer_id = $2',
      [phone, session.id]
    );
    
    await client.query('COMMIT'); // সব ঠিক থাকলে সেভ করা।
  } catch (error) {
    await client.query('ROLLBACK'); // এরর হলে রিভার্ট করা।
    console.error(error);
    return { error: "Failed to update profile" };
  } finally {
    client.release(); // কানেকশন পুলে ফেরত দেওয়া।
  }

  // ৪. ক্যাশ রিভ্যালিডেশন।
  revalidatePath("/account/profile");
  return { success: true };
}

// ─── ঠিকানা মুছে ফেলা (Delete Address) ───────────────────────────────────────────
export async function deleteAddressAction(addressId: number): Promise<{ error?: string }> {
  // সিকিউরিটি চেক: ইউজার লগ-ইন থাকতে হবে।
  const session = await requireCustomer();

  // ১. ওনারশিপ চেক (Ownership Check):
  // নিশ্চিত করা হচ্ছে যে অ্যাড্রেসটি ঐ ইউজারেরই কি না। অন্য ইউজারের অ্যাড্রেস ডিলিট করা রোধ করে (IDOR vulnerability prevention)।
  const res = await db.query(
    'SELECT address_id FROM address WHERE address_id = $1 AND customer_id = $2',
    [addressId, session.id]
  );
  if (res.rows.length === 0) return { error: "Address not found" };

  // ২. ডিলিট অপারেশন।
  await db.query('DELETE FROM address WHERE address_id = $1', [addressId]);
  
  // ক্যাশ আপডেট।
  revalidatePath("/account/profile");
  return {};
}

// ─── ডিফল্ট ঠিকানা নির্ধারণ করা (Set Default Address) ──────────────────────────────────────
// এটি ট্রানজেকশনের একটি চমৎকার উদাহরণ: প্রথমে ইউজারের সব ঠিকানার 'is_default' স্ট্যাটাস 'false' করা হয়, তারপর নির্দিষ্ট ঠিকানাকে 'true' করা হয়।
export async function setDefaultAddressAction(addressId: number): Promise<void> {
  const session = await requireCustomer();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Unset all: ইউজারের সব অ্যাড্রেসের is_default = false করা।
    await client.query(
      'UPDATE address SET is_default = false WHERE customer_id = $1',
      [session.id]
    );
    
    // 2. Set default: শুধুমাত্র নির্বাচিত অ্যাড্রেসের is_default = true করা।
    await client.query(
      'UPDATE address SET is_default = true WHERE address_id = $1',
      [addressId]
    );
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
  } finally {
    client.release();
  }

  revalidatePath("/account/profile");
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/actions/profile.ts`) কাস্টমারের ব্যক্তিগত তথ্য (Profile) এবং শিপিং অ্যাড্রেস (Address Book) পরিচালনার জন্য সার্ভার অ্যাকশন সরবরাহ করে। এখানে মূল ফোকাস হলো মাল্টি-টেবিল ডেটা মিউটেশন (Multi-table Data Mutation) এবং ডাটাবেস ইন্টেগ্রিটি (Database Integrity) বজায় রাখা। 

২. ডাটাবেস ট্রানজেকশন (Database Transactions):
`setDefaultAddressAction` ফাংশনটিতে 'Exclusive State' প্যাটার্ন ইমপ্লিমেন্ট করা হয়েছে। একটি ইউজারের একাধিক ঠিকানার মধ্যে শুধুমাত্র একটিই 'ডিফল্ট' থাকতে পারে। এটি নিশ্চিত করতে একটি ট্রানজেকশনের ভেতরে প্রথমে ইউজারের সমস্ত ঠিকানাকে 'নন-ডিফল্ট' (`is_default = false`) করা হয় এবং তারপর নির্দিষ্ট ঠিকানাকে 'ডিফল্ট' (`is_default = true`) করা হয়। এটি রেস কন্ডিশন (Race Condition) প্রতিরোধ করে।

৩. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
`deleteAddressAction` ফাংশনে Insecure Direct Object Reference (IDOR) অ্যাটাক প্রতিহত করা হয়েছে। ডিলিট করার আগে `SELECT` কুয়েরির মাধ্যমে চেক করা হয় যে `address_id` টি রিকোয়েস্টকারী ইউজারের (`customer_id = session.id`) সাথে সম্পর্কিত কি না। এটি না করলে কোনো হ্যাকার র্যান্ডম `address_id` পাঠিয়ে অন্য ইউজারের ঠিকানা মুছে ফেলতে পারত।
================================================================================
*/
