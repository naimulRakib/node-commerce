// "use server" নির্দেশিকাটি Next.js কে বলে দেয় যে এই ফাইলের সমস্ত ফাংশন শুধুমাত্র সার্ভারেই এক্সিকিউট (execute) হবে। 
// এটি ক্লায়েন্টে (ব্রাউজারে) কোনো সিক্রেট কোড লিক হতে দেয় না।
"use server";

// রাউটিং বা রিডাইরেক্ট (Redirect) করার জন্য Next.js এর ইন-বিল্ট ফাংশন।
import { redirect } from "next/navigation";
// পাসওয়ার্ড হ্যাশিং এবং ভেরিফিকেশনের জন্য 'bcryptjs' লাইব্রেরি ব্যবহার করা হচ্ছে।
import bcrypt from "bcryptjs";
// ডাটাবেস অপারেশন এবং ট্রানজেকশনের জন্য ডাটাবেস অবজেক্ট (db) এবং কানেকশন পুল (pool) আনা হচ্ছে।
import { pool, db } from "@/lib/db";
// সেশন কুকি তৈরি, সেট এবং ডিলিট করার কাস্টম ফাংশনগুলো আনা হচ্ছে।
import { createSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";
// অডিট লগ (Audit Log) লেখার জন্য ফাংশন, যা সেনসিটিভ অ্যাকশনগুলো শ্যাডো টেবিলে সেভ করবে।
import { logAudit } from "@/lib/audit";

/**
 * ============================================================================
 * ─── কাস্টমার লগ-ইন অ্যাকশন (Customer Login) ───────────────────────────────────────────
 * ভাইভা বা ব্যাখ্যার জন্য (For Viva / Explanation):
 * এই অ্যাকশনটি ক্লায়েন্ট-সাইড ফর্ম (Login Form) থেকে সরাসরি কল করা যায়।
 * এটি প্রথমে ইমেইল দিয়ে কাস্টমারকে ডাটাবেসে খোঁজে। এরপর ইউজারের দেওয়া পাসওয়ার্ডটি 
 * bcrypt.compare দিয়ে ডাটাবেসের এনক্রিপ্টেড পাসওয়ার্ডের সাথে মেলায়। 
 * মিললে একটি JWT সেশন তৈরি করে ব্রাউজারে কুকি হিসেবে পাঠিয়ে দেয়।
 * ============================================================================
 */
export async function loginAction(formData: FormData): Promise<{ error?: string }> {
  // ১. ইনপুট সংগ্রহ (Input Extraction): FormData অবজেক্ট থেকে ইমেইল ও পাসওয়ার্ড নেওয়া।
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // ২. বেসিক ভ্যালিডেশন (Basic Validation) - ডেটা আছে কি না চেক করা।
  if (!email || !password) return { error: "Email and password are required" };

  // ৩. ডাটাবেস লুকআপ (Database Lookup): প্যারামিটারাইজড কুয়েরি (Parameterized Query) 
  // ব্যবহার করে SQL Injection অ্যাটাক প্রতিরোধ করা হচ্ছে।
  const res = await db.query('SELECT * FROM customer WHERE email = $1', [email]);
  const customer = res.rows[0];

  // কাস্টমার না থাকলে বা অ্যাকাউন্ট ইনঅ্যাক্টিভ হলে এরর মেসেজ।
  if (!customer || !customer.is_active) return { error: "Invalid credentials" };

  // ৪. পাসওয়ার্ড ম্যাচিং (Password Matching): ক্রিপ্টোগ্রাফিক হ্যাশ চেক করা।
  const valid = await bcrypt.compare(password, customer.password_hash);
  if (!valid) return { error: "Invalid credentials" };

  // ৫. সেশন তৈরি ও কুকি সেট (Session Creation): 
  // [CHECKLIST REQUIREMENT 1]: User Authentication (own code) 
  // এখানে থার্ড পার্টি (যেমন NextAuth বা Firebase) ছাড়াই নিজেদের লজিকে সেশন ম্যানেজ করা হচ্ছে।
  const token = await createSession({
    id: customer.customer_id,
    email: customer.email,
    name: customer.name,
    role: "customer",
  });
  await setSessionCookie(token);

  // ৬. লগইন সফল হলে ইউজারকে হোমপেজে রিডাইরেক্ট (Redirect) করা।
  redirect("/");
}

/**
 * ============================================================================
 * ─── কাস্টমার রেজিস্ট্রেশন অ্যাকশন (Customer Register) ──────────────────────────────────
 * [CHECKLIST REQUIREMENT 3]: Explicit Transaction Control (COMMIT / ROLLBACK)
 * 
 * ভাইভা বা ব্যাখ্যার জন্য (For Viva / Explanation):
 * একজন নতুন কাস্টমার সিস্টেমে এলে তার জন্য ৫টি আলাদা টেবিলে রেকর্ড তৈরি করতে হয় 
 * (customer, profile, cart, wallet, wishlist)। 
 * যদি কোনো কারণে cart টেবিল তৈরি হওয়ার পর wallet তৈরি হতে ফেইল করে, তবে 
 * ডাটাবেস আংশিক ডেটা নিয়ে ইনকন্সিস্টেন্ট (Inconsistent) হয়ে যাবে।
 * এই সমস্যা এড়াতে 'Explicit Transaction' (BEGIN, COMMIT, ROLLBACK) ব্যবহার করা হয়েছে।
 * ============================================================================
 */
export async function registerAction(formData: FormData): Promise<{ error?: string }> {
  // ১. ইনপুট স্যানিটাইজেশন (Input Sanitization): ইনপুট থেকে অপ্রয়োজনীয় স্পেস (trim) মুছে ফেলা।
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  // ২. ইনপুট ভ্যালিডেশন (Validation)।
  if (!name || !email || !password) return { error: "Name, email and password are required" };
  if (password !== confirm) return { error: "Passwords do not match" };
  if (password.length < 6) return { error: "Password must be at least 6 characters" };

  // ডাটাবেসে এই ইমেইলে আগে থেকেই কোনো ইউজার আছে কি না তা চেক করা।
  const existingRes = await db.query('SELECT customer_id FROM customer WHERE email = $1', [email]);
  if (existingRes.rows.length > 0) return { error: "An account with this email already exists" };

  // পাসওয়ার্ড হ্যাশিং (Password Hashing): 12 সল্ট রাউন্ড দিয়ে সিকিউর হ্যাশ তৈরি।
  const passwordHash = await bcrypt.hash(password, 12);
  let customer;

  // ৩. ডাটাবেস ট্রানজেকশন (Database Transaction Management)
  // пул (pool) থেকে একটি ডেডিকেটেড কানেকশন ধার (checkout) নেওয়া হচ্ছে।
  const client = await pool.connect();
  try {
    // ------------------------------------------------------------------------
    // [EXPLICIT TRANSACTION CONTROL - START]
    // ------------------------------------------------------------------------
    await client.query('BEGIN'); // ট্রানজেকশন শুরু। ডাটাবেস লক হবে এবং অ্যাটমিক কাজ শুরু হবে।

    // 3a. Customer তৈরি (Strong Entity): নতুন কাস্টমার ইনসার্ট করা।
    const custRes = await client.query(
      'INSERT INTO customer (name, email, phone, password_hash, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone || null, passwordHash, true]
    );
    customer = custRes.rows[0]; // তৈরিকৃত কাস্টমারের আইডি বা ডেটা নিয়ে নেওয়া হলো।

    // 3b. Profile তৈরি (1:1 Weak Entity): কাস্টমারের প্রোফাইল টেবিল।
    await client.query(
      'INSERT INTO profile (customer_id, full_name) VALUES ($1, $2)',
      [customer.customer_id, name]
    );

    // 3c. Cart তৈরি (1:1): শপিং কার্ট টেবিল।
    await client.query(
      'INSERT INTO cart (customer_id) VALUES ($1)',
      [customer.customer_id]
    );

    // 3d. Wallet তৈরি (1:1): ব্যালেন্স রাখার জন্য ওয়ালেট।
    await client.query(
      'INSERT INTO wallet (customer_id, balance) VALUES ($1, 0)',
      [customer.customer_id]
    );

    // 3e. Wishlist তৈরি (1:1): ফেভারিট প্রোডাক্ট রাখার লিস্ট।
    await client.query(
      'INSERT INTO wishlist (customer_id) VALUES ($1)',
      [customer.customer_id]
    );

    // ------------------------------------------------------------------------
    // [EXPLICIT TRANSACTION CONTROL - COMMIT]
    // ------------------------------------------------------------------------
    // উপরের ৫টি কুয়েরি সফল হলে ডেটাগুলো স্থায়ীভাবে (Durability) সেভ করা হচ্ছে।
    await client.query('COMMIT'); 
  } catch (error) {
    // ------------------------------------------------------------------------
    // [EXPLICIT TRANSACTION CONTROL - ROLLBACK]
    // ------------------------------------------------------------------------
    // যেকোনো একটি কুয়েরি ফেইল করলে রোলব্যাক (ROLLBACK) করে ডাটাবেসকে আগের অবস্থায় ফিরিয়ে নেওয়া হয়।
    await client.query('ROLLBACK'); 
    console.error("[registerAction]", error);
    return { error: "Registration failed. Please try again." };
  } finally {
    // কাজ শেষ হলে কানেকশন পুলে ফেরত দেওয়া হচ্ছে, যাতে অন্য রিকোয়েস্ট এটি ব্যবহার করতে পারে।
    client.release(); 
  }

  // ৪. সিকিউরিটি অডিট (Security Audit):
  // এটি একটি শ্যাডো টেবিলে (Shadow Table) সেনসিটিভ লগ জমা করে।
  await logAudit("customer", customer.customer_id, "INSERT", customer.customer_id, null, {
    name: customer.name,
    email: customer.email,
  });

  // ৫. সেশন তৈরি ও অটো-লগইন (Session Generation):
  // রেজিস্টার হওয়ার সাথে সাথেই ইউজারকে ম্যানুয়ালি লগইন করতে না দিয়ে সরাসরি সেশন তৈরি করে দেওয়া হয়।
  const token = await createSession({
    id: customer.customer_id,
    email: customer.email,
    name: customer.name,
    role: "customer",
  });
  await setSessionCookie(token); // ইউজারের ব্রাউজারে কুকি পাঠানো।

  // ৬. রিডাইরেক্ট (Redirect) করে হোমপেজে পাঠানো।
  redirect("/");
}

/**
 * ─── লগ-আউট অ্যাকশন (Logout) ───────────────────────────────────────────────────
 * ইউজারের ব্রাউজার থেকে সেশন কুকি (JWT) রিমুভ করে দিয়ে তাকে আবার লগ-ইন পেজে রিডাইরেক্ট করে।
 */
export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
