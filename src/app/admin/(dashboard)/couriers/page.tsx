// এসইও (SEO) এর জন্য মেটাডেটা ইন্টারফেস।
import { Metadata } from "next";
// ডাটাবেস কোয়েরি চালানোর জন্য ডাটাবেস ইন্সট্যান্স।
import { db } from "@/lib/db";
// ক্লায়েন্ট সাইড রেন্ডারিং এবং ইন্টারঅ্যাক্টিভিটির জন্য ক্লায়েন্ট কম্পোনেন্ট।
import AdminCouriersClient from "./AdminCouriersClient";

// ─── মেটাডেটা (Metadata) ──────────────────────────────────────────────────────────
export const metadata: Metadata = { title: "Couriers — Admin" };

// ─── সার্ভার কম্পোনেন্ট (Server Component) ──────────────────────────────
export default async function AdminCouriersPage() {
  // ১. ডেটা ফেচিং এবং অ্যাগ্রিগেশন (Data Fetching & Aggregation): 
  // সাবকুয়েরি (Subquery) ব্যবহার করে প্রতিটি কুরিয়ারের সাথে সম্পর্কিত 
  // মোট অর্ডারের সংখ্যা (orders_count) বের করা হচ্ছে। 
  const res = await db.query(`
    SELECT c.*, 
           (SELECT COUNT(*) FROM customer_order o WHERE o.courier_id = c.courier_id) as orders_count
    FROM courier c
    ORDER BY c.name ASC
  `);

  // ২. ডেটা ট্রান্সফরমেশন (Data Transformation):
  // প্রিজমা (Prisma) বা অন্য ORM-এ যেমন 'include: { _count: { select: { orders: true } } }' 
  // স্ট্রাকচার থাকে, ঠিক সেই স্ট্রাকচারের সাথে সামঞ্জস্য রেখে র (Raw) SQL ডেটাকে ট্রান্সফর্ম করা হচ্ছে।
  const couriers = res.rows.map(c => ({
    ...c,
    _count: { orders: Number(c.orders_count) } // COUNT() সবসময় BigInt/String হিসেবে আসে, তাই Number এ কাস্ট করা হলো।
  }));

  // ৩. কম্পোনেন্ট ডেলিগেশন (Component Delegation):
  return <AdminCouriersClient initialCouriers={couriers} />;
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই সার্ভার কম্পোনেন্টটি কুরিয়ার সার্ভিসগুলোর তালিকা এবং তাদের পারফরম্যান্স মেট্রিক্স (Performance Metrics) প্রস্তুত করে। এটি ডাটাবেস থেকে র (Raw) SQL কুয়েরির মাধ্যমে ডেটা তুলে আনে এবং `AdminCouriersClient` কম্পোনেন্টকে প্রপস হিসেবে প্রদান করে। 

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
অ্যাডমিন রাউটের অংশ হওয়ায় এটি সম্পূর্ণ সুরক্ষিত। সরাসরি SQL কুয়েরিতে কোনো এক্সটার্নাল বা ইউজার-প্রোভাইডেড ভ্যারিয়েবল ব্যবহার না হওয়ায় এসকিউএল ইনজেকশনের (SQL Injection) কোনো সুযোগ নেই।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এখানে সাবকুয়েরি (Subquery) ব্যবহার করে একই ডেটাবেস ট্রিপে (Database Trip) কুরিয়ারের মূল তথ্য এবং তাদের দ্বারা ডেলিভার করা মোট অর্ডারের কাউন্ট (Count) ফেচ করা হয়েছে। এটি N+1 কুয়েরি প্রবলেম (N+1 Query Problem) সমাধান করে এবং অ্যাপ্লিকেশনের পারফরম্যান্স অপ্টিমাইজ করে। পরবর্তীতে `map` ফাংশনের মাধ্যমে ORM-লাইক (ORM-like) স্ট্রাকচারে ডেটা প্রসেস করে ক্লায়েন্ট কম্পোনেন্টে পাঠানো হয়। 
================================================================================
*/
