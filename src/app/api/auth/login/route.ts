// নেক্সট.জেএস (Next.js) এর সার্ভার রেসপন্স অবজেক্ট (Server Response Object)।
import { NextResponse } from "next/server";
// পাসওয়ার্ড হ্যাশিং (Hashing) এবং যাচাই করার জন্য 'bcryptjs' লাইব্রেরি।
import bcrypt from "bcryptjs";
// ডাটাবেসের সাথে সরাসরি যোগাযোগ করার জন্য।
import { db } from "@/lib/db";
// সেশন (Session) টোকেন তৈরি এবং কুকিতে সেট করার জন্য হেল্পার ফাংশন।
import { createSession, setSessionCookie } from "@/lib/auth";

// ─── লগ-ইন এপিআই এন্ডপয়েন্ট (Login API Endpoint) ──────────────
// এটি একটি POST রিকোয়েস্ট হ্যান্ডলার, যা ইউজারের ক্রেডেনশিয়ালস (Credentials) ভেরিফাই করে।
export async function POST(request: Request) {
  try {
    // ১. রিকোয়েস্ট বডি পার্সিং (Request Body Parsing):
    // ক্লায়েন্ট থেকে পাঠানো JSON ডেটা এক্সট্রাক্ট করা।
    const body = await request.json();
    const { email, password } = body;

    // ২. ইনপুট ভ্যালিডেশন (Input Validation):
    // ইমেইল বা পাসওয়ার্ড না থাকলে 400 Bad Request রেসপন্স পাঠানো।
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ৩. ডাটাবেস লুকআপ (Database Lookup):
    // প্রদত্ত ইমেইলের মাধ্যমে কাস্টমার খুঁজে বের করা। SQL Injection রোধে প্যারামিটারাইজড কুয়েরি ($1) ব্যবহার করা হয়েছে।
    const res = await db.query('SELECT * FROM customer WHERE email = $1', [email.trim().toLowerCase()]);
    const customer = res.rows[0];
    
    // কাস্টমার না পাওয়া গেলে বা ইনঅ্যাক্টিভ হলে 401 Unauthorized রেসপন্স পাঠানো। (সিকিউরিটি বেস্ট প্র্যাকটিস: "Invalid credentials" বলা, যাতে হ্যাকার বুঝতে না পারে যে ইমেইলটি সিস্টেমে আছে কি না)।
    if (!customer || !customer.is_active) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ৪. পাসওয়ার্ড যাচাই (Password Verification):
    // ইউজারের দেয়া প্লেইন টেক্সট পাসওয়ার্ড এবং ডাটাবেসে সেভ করা হ্যাশড পাসওয়ার্ড তুলনা করা।
    const valid = await bcrypt.compare(password, customer.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ৫. সেশন তৈরি (Session Creation):
    // পাসওয়ার্ড সঠিক হলে JWT (JSON Web Token) বা সেশন টোকেন জেনারেট করা।
    const token = await createSession({
      id: customer.customer_id,
      email: customer.email,
      name: customer.name,
      role: "customer",
    });
    
    // ৬. কুকি সেট করা (Setting Cookie):
    // ইউজারের ব্রাউজারে 'HTTPOnly' এবং 'Secure' ফ্লাগ সহ কুকি সেট করা।
    await setSessionCookie(token);

    // ৭. সফল রেসপন্স (Successful Response):
    return NextResponse.json({
      message: "Login successful",
      customer: {
        id: customer.customer_id,
        name: customer.name,
        email: customer.email,
      }
    });
  } catch (error) {
    // ৮. এক্সেপশন হ্যান্ডলিং (Exception Handling):
    console.error("[POST /api/auth/login]", error);
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
এই ফাইলটি (`src/app/api/auth/login/route.ts`) সিস্টেমে গ্রাহকদের (Customers) প্রবেশের জন্য দায়ী। এটি একটি স্ট্যান্ডার্ড REST API এন্ডপয়েন্ট। এটি ক্লায়েন্ট থেকে ইমেইল ও পাসওয়ার্ড গ্রহণ করে, ডাটাবেসে ইউজারের অস্তিত্ব যাচাই করে, `bcrypt` অ্যালগরিদম ব্যবহার করে ক্রিপ্টোগ্রাফিক পাসওয়ার্ড ম্যাচিং করে এবং পরিশেষে ইউজারের জন্য একটি সেশন টোকেন তৈরি করে ব্রাউজারে কুকি হিসেবে সেট করে।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এই এপিআইটি কঠোর নিরাপত্তা নীতি (Strict Security Policies) মেনে চলে। 
- প্রথমত, এটি "Time-based Attack" বা "User Enumeration Attack" প্রতিরোধ করার জন্য ভুল ইমেইল বা ভুল পাসওয়ার্ড—উভয় ক্ষেত্রেই জেনেরিক "Invalid credentials" মেসেজ প্রদান করে। 
- দ্বিতীয়ত, `bcrypt.compare` ফাংশনটি পাসওয়ার্ড হ্যাশ যাচাই করার সময় ধীরগতির (Computationally expensive) একটি প্রসেস ব্যবহার করে, যা "Brute-force Attack" কে নিরুৎসাহিত করে।
- তৃতীয়ত, সেশন টোকেনটি সরাসরি রেসপন্স বডিতে না পাঠিয়ে `setSessionCookie` এর মাধ্যমে "HTTPOnly" কুকিতে সেট করা হয়, ফলে ক্লায়েন্ট-সাইড জাভাস্ক্রিপ্ট (যেমন: XSS Attack) এই টোকেনটি চুরি করতে পারে না।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এপিআইটির ডেটা ফ্লো খুবই লিনিয়ার (Linear)। রিকোয়েস্ট -> ভ্যালিডেশন -> ডাটাবেস কুয়েরি -> হ্যাশ ভেরিফিকেশন -> টোকেন জেনারেশন -> রেসপন্স। ত্রুটি ঘটলে (যেমন: ডাটাবেস ডাউন থাকলে) `catch` ব্লকের মাধ্যমে 500 স্ট্যাটাস কোড (Internal Server Error) পাঠানো হয়, যাতে ক্লায়েন্ট অ্যাপ্লিকেশন ক্র্যাশ না করে।
================================================================================
*/
