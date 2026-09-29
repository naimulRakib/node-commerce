// নেক্সট.জেএস (Next.js) এর সার্ভার রেসপন্স অবজেক্ট।
import { NextResponse } from "next/server";
// পাসওয়ার্ড হ্যাশিং (Hashing) করার জন্য 'bcryptjs' লাইব্রেরি।
import bcrypt from "bcryptjs";
// ডাটাবেস অবজেক্ট (db) এবং কানেকশন পুল (pool) ইমপোর্ট। ট্রানজেকশনের (Transaction) জন্য pool প্রয়োজন।
import { db, pool } from "@/lib/db";
// সেশন কুকি পরিচালনার হেল্পার ফাংশন।
import { createSession, setSessionCookie } from "@/lib/auth";
// সিকিউরিটি অডিট লগিং এর জন্য।
import { logAudit } from "@/lib/audit";

// ─── রেজিস্ট্রেশন এপিআই এন্ডপয়েন্ট (Registration API Endpoint) ──────────────
// এটি একটি POST রিকোয়েস্ট হ্যান্ডলার, যা নতুন কাস্টমার তৈরি করে।
export async function POST(request: Request) {
  try {
    // ১. রিকোয়েস্ট বডি পার্সিং (Request Body Parsing):
    const body = await request.json();
    const { name, email, phone, password } = body;

    // ২. ইনপুট ভ্যালিডেশন (Input Validation):
    // নাম, ইমেইল এবং পাসওয়ার্ড বাধ্যতামূলক (Mandatory) ফিল্ড।
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 } // 400 Bad Request
      );
    }

    // পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টার হতে হবে।
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // ইমেইল ঠিকানার শুরুতে বা শেষে স্পেস থাকলে তা মুছে ফেলা এবং লোয়ার কেসে (Lower case) রূপান্তর করা।
    const lowerEmail = email.trim().toLowerCase();

    // ৩. ডুপ্লিকেট চেকিং (Duplicate Checking):
    // এই ইমেইলে আগে থেকেই কোনো অ্যাকাউন্ট আছে কি না তা চেক করা।
    const existingRes = await db.query('SELECT customer_id FROM customer WHERE email = $1', [lowerEmail]);
    if (existingRes.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 } // 409 Conflict
      );
    }

    // ৪. ডেটা প্রিপারেশন (Data Preparation):
    // প্লেইন টেক্সট পাসওয়ার্ডকে 12 রাউন্ড 'Salting' সহ হ্যাশ করা। এটি Brute-force এবং Rainbow Table অ্যাটাক প্রতিরোধ করে।
    const passwordHash = await bcrypt.hash(password, 12);
    let customer;

    // ৫. ডাটাবেস ট্রানজেকশন (Database Transaction):
    // পুল থেকে একটি ডেডিকেটেড ক্লায়েন্ট (Client) কানেকশন নেওয়া হচ্ছে।
    const client = await pool.connect();
    try {
      // ট্রানজেকশন শুরু (BEGIN)। এর ফলে পরবর্তী সব কুয়েরি একটি 'Atom' হিসেবে কাজ করবে।
      await client.query('BEGIN');

      // 5a. Create Customer (Strong Entity): কাস্টমার টেবিলে প্রধান রেকর্ড তৈরি করা।
      const custRes = await client.query(
        'INSERT INTO customer (name, email, phone, password_hash, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name.trim(), lowerEmail, phone ? phone.trim() : null, passwordHash, true]
      );
      customer = custRes.rows[0];

      // 5b. Create Profile (1:1 Weak Entity): কাস্টমারের প্রোফাইল টেবিল তৈরি করা।
      await client.query(
        'INSERT INTO profile (customer_id, full_name) VALUES ($1, $2)',
        [customer.customer_id, name.trim()]
      );

      // 5c. Create Cart (1:1): ইউজারের শপিং কার্ট তৈরি করা।
      await client.query(
        'INSERT INTO cart (customer_id) VALUES ($1)',
        [customer.customer_id]
      );

      // 5d. Create Wallet (1:1): ইউজারের ডিজিটাল ওয়ালেট তৈরি করা (প্রাথমিক ব্যালান্স ০)।
      await client.query(
        'INSERT INTO wallet (customer_id, balance) VALUES ($1, 0)',
        [customer.customer_id]
      );

      // 5e. Create Wishlist (1:1): ইউজারের উইশলিস্ট তৈরি করা।
      await client.query(
        'INSERT INTO wishlist (customer_id) VALUES ($1)',
        [customer.customer_id]
      );

      // সব ঠিক থাকলে ট্রানজেকশন কমিট (COMMIT) করা, অর্থাৎ ডেটা স্থায়ীভাবে সেভ করা।
      await client.query('COMMIT');
    } catch (error) {
      // কোনো একটি ধাপে এরর হলে পুরো প্রসেস রোলব্যাক (ROLLBACK) করা, যাতে আংশিক (Partial) ডেটা সেভ না হয়।
      await client.query('ROLLBACK');
      throw error; // ক্যাচ ব্লকে এররটি পাস করে দেওয়া।
    } finally {
      // ট্রানজেকশন শেষে কানেকশনটি পুলে ফেরত দেওয়া।
      client.release();
    }

    // ৬. অডিট লগিং (Audit Logging):
    // সিকিউরিটি পারপাসে নতুন কাস্টমার তৈরির ইভেন্টটি অডিট লগে সেভ করা।
    await logAudit("customer", customer.customer_id, "INSERT", customer.customer_id, null, {
      name: customer.name,
      email: customer.email,
    });

    // ৭. অটো-লগইন (Auto-Login):
    // রেজিস্ট্রেশনের পরপরই ইউজারকে লগ-ইন করিয়ে দেওয়ার জন্য সেশন তৈরি করা।
    const token = await createSession({
      id: customer.customer_id,
      email: customer.email,
      name: customer.name,
      role: "customer",
    });
    
    // ব্রাউজারে কুকি সেট করা।
    await setSessionCookie(token);

    // ৮. সফল রেসপন্স (Successful Response):
    return NextResponse.json(
      { 
        message: "Registration successful", 
        customer: {
          id: customer.customer_id,
          name: customer.name,
          email: customer.email
        }
      },
      { status: 201 } // 201 Created
    );
  } catch (error) {
    // ৯. এক্সেপশন হ্যান্ডলিং (Exception Handling):
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/api/auth/register/route.ts`) নতুন কাস্টমার রেজিস্ট্রেশন (Customer Onboarding) পরিচালনা করে। এটি ইনপুট ভ্যালিডেট করে, ইমেইলের অনন্যতা (Uniqueness) যাচাই করে এবং একটি শক্তিশালী পাসওয়ার্ড হ্যাশ তৈরি করে। সবশেষে, এটি সফলভাবে অ্যাকাউন্ট তৈরি হলে ইউজারকে স্বয়ংক্রিয়ভাবে (Automatically) সিস্টেমে লগ-ইন করিয়ে দেয়।

২. ডাটাবেস ট্রানজেকশন ও এসিআইডি (ACID Properties):
এখানে ডাটাবেসের ACID (Atomicity, Consistency, Isolation, Durability) প্রপার্টি খুব সুন্দরভাবে বাস্তবায়ন করা হয়েছে। একটি নতুন কাস্টমার তৈরি করার অর্থ হলো ডাটাবেসে ৫টি ভিন্ন টেবিলে (`customer`, `profile`, `cart`, `wallet`, `wishlist`) ডেটা ইনসার্ট করা। যদি কোনো কারণে `cart` টেবিল তৈরি হওয়ার পর `wallet` টেবিলে এরর হয়, তবে ইউজারের অ্যাকাউন্ট অসম্পূর্ণ থেকে যাবে, যা ডেটা ইনকন্সিস্টেন্সি (Data Inconsistency) তৈরি করবে। এই সমস্যা সমাধানের জন্য `BEGIN`, `COMMIT` এবং `ROLLBACK` কমান্ডের মাধ্যমে 'ডাটাবেস ট্রানজেকশন' (Database Transaction) ব্যবহার করা হয়েছে। এর ফলে ৫টি ইনসার্ট অপারেশন একটি সিঙ্গেল 'অ্যাটমিক' (Atomic) টাস্ক হিসেবে কাজ করে—হয় ৫টিই সফল হবে, না হয় কোনোটিই হবে না।

৩. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
- ডেটাবেসে পাসওয়ার্ড সেভ করার সময় `bcrypt` অ্যালগরিদম ১২ রাউন্ড (Cost factor 12) সল্টিং (Salting) ব্যবহার করে, যা বর্তমান সিকিউরিটি স্ট্যান্ডার্ড অনুযায়ী অত্যন্ত নিরাপদ।
- ইউজারের অ্যাকশন ট্র্যাকিং এর জন্য ডাটাবেসে `logAudit` রেকর্ড রাখা হয়, যা পরবর্তীতে সিকিউরিটি অডিটে (Security Audit) সাহায্য করে।
================================================================================
*/
