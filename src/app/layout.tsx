// নেক্সট.জেএস (Next.js) এর মেটাডেটা টাইপ ইমপোর্ট করা হচ্ছে, যা এসইও (SEO) অপ্টিমাইজেশনের জন্য ব্যবহৃত হয়।
import type { Metadata } from "next";
// গুগল ফন্ট (Google Fonts) থেকে ইন্টার (Inter) এবং আউটফিট (Outfit) ফন্ট ইমপোর্ট করা হচ্ছে।
import { Inter, Outfit } from "next/font/google";
// গ্লোবাল সিএসএস (Global CSS) স্টাইলশিট যুক্ত করা হচ্ছে।
import "./globals.css";

// ─── ফন্ট কনফিগারেশন (Font Configuration) ──────────────
// ইন্টার ফন্ট: সাধারণ টেক্সট বা প্যারাগ্রাফের জন্য। 'variable' অপশনটি সিএসএস ভ্যারিয়েবল তৈরি করে।
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
// আউটফিট ফন্ট: হেডলাইন বা বড় টেক্সটের জন্য।
const outfit = Outfit({ subsets: ["latin"], display: "swap", variable: "--font-outfit" });

export const dynamic = "force-dynamic";

// ─── গ্লোবাল মেটাডেটা (Global Metadata) ──────────────
// পুরো অ্যাপ্লিকেশনের ডিফল্ট এসইও মেটা ট্যাগগুলো এখানে কনফিগার করা হয়েছে।
export const metadata: Metadata = {
  title: "NodeCommerce — Premium B2C Shopping",
  description: "Discover thousands of premium products at unbeatable prices. Shop fashion, electronics, lifestyle, and more.",
  keywords: "ecommerce, shopping, fashion, electronics, Bangladesh, online store",
};

// ─── রুট লেআউট (Root Layout) ──────────────
// এটি অ্যাপ্লিকেশনের প্রধান বা রুট (Root) লেআউট। প্রতিটি পেজ এই লেআউটের চিলড্রেন (children) হিসেবে রেন্ডার হয়।
import DbStatusBadge from "@/components/DbStatusBadge";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
        {children}
        <DbStatusBadge />
      </body>
    </html>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/layout.tsx`) নেক্সট.জেএস অ্যাপ রাউটারের (App Router) মূল এন্ট্রি পয়েন্ট বা রুট লেআউট (Root Layout)। এটি অ্যাপ্লিকেশনের `<html>` এবং `<body>` ট্যাগ সংজ্ঞায়িত করে। এটি গ্লোবাল ফন্ট (Inter, Outfit) এবং গ্লোবাল সিএসএস (`globals.css`) লোড করে। নেক্সট.জেএস স্বয়ংক্রিয়ভাবে এই লেআউটের ভেতরে অন্য সব পেজের কন্টেন্ট রেন্ডার করে।

২. পারফরম্যান্স অপ্টিমাইজেশন (Performance Optimization):
এখানে `next/font/google` ব্যবহার করা হয়েছে যা বিল্ড টাইমে (Build Time) ফন্টগুলো ডাউনলোড করে এবং অ্যাপ্লিকেশনের সাথে বান্ডেল (Bundle) করে দেয়। এর ফলে ফন্টের জন্য ব্রাউজারকে আলাদা করে গুগলের সার্ভারে রিকোয়েস্ট পাঠাতে হয় না এবং লেআউট শিফট (Cumulative Layout Shift - CLS) শূন্য (0) হয়। `display: "swap"` প্রপার্টি নিশ্চিত করে যে ফন্ট লোড হওয়ার আগ পর্যন্ত ইউজার ডিফল্ট সিস্টেম ফন্ট দেখতে পাবেন।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এটি একটি স্ট্যাটিক সার্ভার কম্পোনেন্ট (Static Server Component) যা মূলত অন্যান্য কম্পোনেন্টগুলোকে ধারণ করার জন্য একটি শেল (Shell) তৈরি করে। এখানে মেটাডেটা (Metadata) অবজেক্টটি নেক্সট.জেএস এর এসইও ইঞ্জিনের মাধ্যমে প্রসেস হয়ে ব্রাউজারের `<head>` ট্যাগে ইনজেক্ট (Inject) হয়, যা সার্চ ইঞ্জিনের ক্রলারদের (Crawlers) অ্যাপ্লিকেশন ইনডেক্সিংয়ে সাহায্য করে।
================================================================================
*/
