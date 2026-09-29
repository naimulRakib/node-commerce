// এসইও (SEO) এর জন্য মেটাডেটা ইন্টারফেস।
import { Metadata } from "next";
// ডাটাবেস কোয়েরি চালানোর জন্য ডাটাবেস ইন্সট্যান্স।
import { db } from "@/lib/db";
// ক্লায়েন্ট সাইড রেন্ডারিং এবং ইন্টারঅ্যাক্টিভিটির জন্য ক্লায়েন্ট কম্পোনেন্ট ইম্পোর্ট করা হচ্ছে।
import AdminCouponsClient from "./AdminCouponsClient";

// ─── মেটাডেটা (Metadata) ──────────────────────────────────────────────────────────
export const metadata: Metadata = { title: "Coupons — Admin" };

// ─── সার্ভার কম্পোনেন্ট (Server Component) ──────────────────────────────
export default async function AdminCouponsPage() {
  // ১. ডেটা ফেচিং (Data Fetching): 
  // ডাটাবেস থেকে সব কুপন ফেচ করা হচ্ছে এবং তৈরির সময় (created_at) অনুযায়ী ডিসেন্ডিং (Descending) অর্ডারে সাজানো হচ্ছে।
  const res = await db.query('SELECT * FROM coupon ORDER BY created_at DESC');
  const coupons = res.rows;

  // ২. ডেটা সিরিয়ালাইজেশন (Data Serialization):
  // নেক্সট.জেএস (Next.js) সার্ভার কম্পোনেন্ট থেকে ক্লায়েন্ট কম্পোনেন্টে প্রপস (Props) পাস করার সময় 
  // শুধুমাত্র প্লেইন অবজেক্ট (Plain JSON Object) সমর্থন করে। ডাটাবেসের `Numeric` বা `Decimal` টাইপগুলো 
  // প্রায়শই অবজেক্ট হিসেবে আসে, তাই সেগুলোকে স্ট্রিং-এ (String) রূপান্তর করে সিরিয়ালাইজ করা হচ্ছে।
  const serializedCoupons = coupons.map(c => ({
    ...c,
    discount_value: c.discount_value.toString(),
    min_spend: c.min_spend.toString(),
    max_discount: c.max_discount ? c.max_discount.toString() : null,
  }));

  // ৩. কম্পোনেন্ট ডেলিগেশন (Component Delegation):
  // সিরিয়ালাইজ করা ডেটাগুলোকে `initialCoupons` প্রপ হিসেবে ক্লায়েন্ট কম্পোনেন্টে পাঠানো হচ্ছে।
  return <AdminCouponsClient initialCoupons={serializedCoupons} />;
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/admin/coupons/page.tsx`) কুপন ম্যানেজমেন্ট পেজের জন্য একটি "সার্ভার-সাইড র‍্যাপার (Server-side Wrapper)" হিসেবে কাজ করে। এর মূল দায়িত্ব হলো প্রাথমিক ডেটাবেস কোয়েরি এক্সিকিউট করা এবং সেই ডেটাকে ক্লায়েন্ট-সাইড কম্পোনেন্ট (`AdminCouponsClient`) এর ব্যবহার উপযোগী করে সিরিয়ালাইজ করা। 

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এটি `AdminLayout` এর অধীনে রেন্ডার হয়, তাই এটি ডিফল্টভাবেই সুরক্ষিত। ডেটাবেস থেকে শুধুমাত্র কুপনের তালিকা রিড (Read) করা হচ্ছে, এখানে কোনো মিউটেশন (Mutation) বা ইউজার ইনপুট না থাকায় এসকিউএল ইনজেকশনের (SQL Injection) কোনো ঝুঁকি নেই। 

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এখানে সার্ভার এবং ক্লায়েন্ট কম্পোনেন্টের মধ্যে সেপারেশন অফ কনসার্ন (Separation of Concerns) খুব চমৎকারভাবে বজায় রাখা হয়েছে। ডেটাবেস থেকে র (Raw) ডেটা নিয়ে সার্ভার সাইডে `toString()` এর মাধ্যমে সিরিয়ালাইজ করে তবেই ক্লায়েন্টে পাঠানো হচ্ছে। এটি নেক্সট.জেএস-এর `Warning: Only plain objects can be passed to Client Components` এররটি প্রতিরোধ করে।
================================================================================
*/
