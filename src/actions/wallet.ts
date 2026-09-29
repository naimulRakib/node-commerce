"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/auth";

export async function addMoneyAction(amount: number) {
  const session = await requireCustomer();
  if (!amount || amount <= 0) return { error: "Invalid amount" };

  try {
    await db.query(
      "UPDATE wallet SET balance = balance + $1 WHERE customer_id = $2",
      [amount, session.id]
    );
    revalidatePath("/account/wallet");
    return { success: true };
  } catch (err: any) {
    console.error("[addMoneyAction]", err);
    return { error: "Failed to add money" };
  }
}


/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি নেক্সট.জেএস (Next.js) এর "Server Actions" প্যাটার্ন ইমপ্লিমেন্ট করে। সার্ভার অ্যাকশনগুলো মূলত ক্লায়েন্ট-সাইড কম্পোনেন্ট থেকে সরাসরি কল করা যায়, যা ডেটা মিউটেশন (Data Mutation) এবং ডেটাবেস অপারেশনের জন্য ব্যবহৃত হয়। এটি API Route লেখার প্রয়োজনীয়তা দূর করে এবং টাইপ-সেইফ (Type-safe) RPC (Remote Procedure Call) প্রদান করে।

২. লজিক ও ডেটা ফ্লো (Logic & Data Flow):
- ইনপুট গ্রহণ: ফর্ম ডেটা বা আর্গুমেন্ট রিসিভ করে।
- ভ্যালিডেশন: ইনপুট ডেটা ভ্যালিডেট করে (যেমন: টাইপ চেকিং, নাল চেকিং)।
- ডেটাবেস অপারেশন: 'db.query' বা ট্রানজ্যাকশন ফাংশনের মাধ্যমে PostgreSQL এ ডেটা সেভ বা আপডেট করে।
- রিভ্যালিডেশন: অপারেশন শেষে 'revalidatePath' কল করে ক্যাশ আপডেট করে, যেন ক্লায়েন্টে লেটেস্ট ডেটা শো করে।

৩. ব্যবহারিক গুরুত্ব (Practical Significance):
অ্যাকশন ফাইলগুলো বিজনেস লজিক এনক্যাপসুলেট (Encapsulate) করে। এর ফলে UI কম্পোনেন্টগুলো লজিক-ফ্রি থাকে এবং কোড মেইনটেইন (Maintain) করা সহজ হয়।
================================================================================
*/
