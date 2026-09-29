// নেক্সট.জেএস (Next.js) এর সার্ভার রেসপন্স অবজেক্ট।
import { NextResponse } from "next/server";
// কুকি থেকে ইউজারের বর্তমান সেশন (Session Payload) ডিকোড করার জন্য।
import { getSession } from "@/lib/auth";
// ডাটাবেস কানেকশন।
import { db } from "@/lib/db";

// ─── প্রোফাইল ফেচিং এপিআই (Me / Current User API Endpoint) ──────────────
// এটি একটি GET রিকোয়েস্ট হ্যান্ডলার, যা লগ-ইন থাকা ইউজারের বিস্তারিত তথ্য প্রদান করে।
export async function GET() {
  try {
    // ১. সেশন ভেরিফিকেশন (Session Verification):
    // রিকোয়েস্টের কুকি থেকে JWT টোকেন রিড এবং ভেরিফাই করা।
    const session = await getSession();

    // সেশন না থাকলে (লগ-ইন না থাকলে) 401 Unauthorized রেসপন্স।
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ২. রোল-বেসড রাউটিং (Role-Based Logic: Customer):
    // যদি ইউজারের রোল 'customer' হয়, তবে কাস্টমার টেবিল থেকে তার ডেটা আনা হবে।
    if (session.role === "customer") {
      // কাস্টমারের বেসিক ইনফরমেশন ফেচ করা।
      const res = await db.query(
        'SELECT customer_id, name, email, phone, is_verified FROM customer WHERE customer_id = $1',
        [session.id]
      );
      const customer = res.rows[0];

      // কাস্টমার ডাটাবেসে না থাকলে 404 Not Found।
      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      // কাস্টমারের প্রোফাইল (Weak Entity) ফেচ করা।
      const profileRes = await db.query('SELECT * FROM profile WHERE customer_id = $1', [session.id]);
      customer.profile = profileRes.rows[0] || null;

      // কাস্টমারের ওয়ালেট (Wallet) ফেচ করা।
      const walletRes = await db.query('SELECT * FROM wallet WHERE customer_id = $1', [session.id]);
      customer.wallet = walletRes.rows[0] || null;

      // ৩. সফল রেসপন্স (কাস্টমার):
      return NextResponse.json({ user: customer, role: "customer" });
    }

    // ৪. রোল-বেসড রাউটিং (Role-Based Logic: Admin):
    // যদি ইউজারের রোল 'admin' বা 'super_admin' হয়, তবে অ্যাডমিন টেবিল থেকে ডেটা আনা হবে।
    if (session.role === "admin" || session.role === "super_admin") {
      const res = await db.query(
        'SELECT admin_id, name, email, role FROM admin_user WHERE admin_id = $1',
        [session.id]
      );
      const admin = res.rows[0];

      if (!admin) {
        return NextResponse.json(
          { error: "Admin not found" },
          { status: 404 }
        );
      }

      // ৫. সফল রেসপন্স (অ্যাডমিন):
      return NextResponse.json({ user: admin, role: session.role });
    }

    // ৬. অজানা রোল (Unknown Role):
    return NextResponse.json(
      { error: "Invalid role in session" },
      { status: 403 } // 403 Forbidden (সেশন আছে কিন্তু রোল ভ্যালিড নয়)
    );

  } catch (error) {
    // ৭. এক্সেপশন হ্যান্ডলিং (Exception Handling):
    console.error("[GET /api/auth/me]", error);
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
এই ফাইলটি (`src/app/api/auth/me/route.ts`) সিস্টেমে বর্তমানে লগ-ইন থাকা ইউজারের (Current Authenticated User) বিস্তারিত তথ্য পাওয়ার জন্য ব্যবহৃত হয়। ক্লায়েন্ট-সাইড অ্যাপ্লিকেশন (যেমন SPA বা রিঅ্যাক্ট কম্পোনেন্ট) যখন রিলোড হয়, তখন কুকি থেকে ইউজারের স্টেট পুনরুদ্ধার (State Hydration) করার জন্য এই এন্ডপয়েন্টটিতে কল করা হয়।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এই এপিআইটি সম্পূর্ণভাবে সিকিউরড, কারণ এটি ডাটাবেস কুয়েরি চালানোর আগেই `getSession()` এর মাধ্যমে কুকি ভেরিফাই করে। যদি টোকেন এক্সপায়ারড (Expired) হয় বা টেম্পারড (Tampered) হয়, তবে ডাটাবেস পর্যন্ত রিকোয়েস্ট পৌঁছানোর আগেই 401 Unauthorized রেসপন্স দেওয়া হয়। এখানে পলিফারফিজম (Polymorphism) বা রোল-বেসড অ্যাক্সেস কন্ট্রোল (RBAC - Role-Based Access Control) প্যাটার্ন ব্যবহার করা হয়েছে, যেখানে ইউজারের `role` এর উপর ভিত্তি করে সিস্টেম সিদ্ধান্ত নেয় যে ডেটা `customer` টেবিল থেকে আসবে নাকি `admin_user` টেবিল থেকে।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
কাস্টমারের ক্ষেত্রে, সিস্টেমটি তিনটি আলাদা কুয়েরি (Customer, Profile, Wallet) চালায় এবং ডেটাগুলোকে একটি সিঙ্গল নেস্টেড অবজেক্টে (Nested JSON Object) অ্যাগ্রিগেট (Aggregate) করে। এটি "Backend for Frontend (BFF)" প্যাটার্নের একটি প্রকৃষ্ট উদাহরণ, যেখানে ফ্রন্টএন্ডের সুবিধার জন্য ব্যাকএন্ড একাধিক টেবিলের ডেটা একসাথে করে পাঠায়, যাতে ফ্রন্টএন্ডকে বারবার এপিআই কল করতে না হয় (Over-fetching বা Under-fetching সমস্যা সমাধান)।
================================================================================
*/
