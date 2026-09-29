import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});


/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি প্রোজেক্টের একটি ইউটিলিটি (Utility) বা সাপোর্টিং মডিউল হিসেবে কাজ করে। টাইপস্ক্রিপ্ট (TypeScript) ব্যবহারের কারণে এতে স্ট্যাটিক টাইপ চেকিং (Static Type Checking) নিশ্চিত হয়, যা রানটাইম এরর (Runtime Error) হওয়ার সম্ভাবনা অনেকাংশে কমিয়ে দেয়।

২. লজিক (Logic):
এখানে নির্দিষ্ট কিছু হেল্পার ফাংশন, কনফিগারেশন বা টাইপ ডেফিনেশন থাকতে পারে যা প্রোজেক্টের বিভিন্ন অংশে ইমপোর্ট করে ব্যবহার করা হয় (DRY Principle - Don't Repeat Yourself)।

৩. ব্যবহারিক গুরুত্ব (Practical Significance):
কোডবেসকে ক্লিন (Clean) এবং মডুলার (Modular) রাখার জন্য এ ধরনের শেয়ার্ড ফাইলের গুরুত্ব অপরিসীম।
================================================================================
*/
