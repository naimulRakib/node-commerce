import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // 1. Run a test query against PostgreSQL
    const timeResult = await db.query("SELECT NOW() as db_time, current_database() as db_name, version()");
    const customerCountResult = await db.query("SELECT COUNT(*) as count FROM customer");

    const dbTime = timeResult.rows[0].db_time;
    const dbName = timeResult.rows[0].db_name;
    const pgVersion = timeResult.rows[0].version;
    const customerCount = customerCountResult.rows[0].count;

    return NextResponse.json({
      status: "connected",
      message: "Successfully connected to PostgreSQL Database!",
      database: {
        name: dbName,
        time: dbTime,
        version: pgVersion.split(" ")[0] + " " + pgVersion.split(" ")[1],
        total_customers: parseInt(customerCount, 10),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "disconnected",
        error: error.message || "Failed to connect to database",
      },
      { status: 500 }
    );
  }
}


/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এটি নেক্সট.জেএস (Next.js) এর একটি API Route হ্যান্ডলার (Route Handler)। এটি REST API এন্ডপয়েন্ট তৈরি করে, যা HTTP রিকোয়েস্ট (GET, POST, PUT, DELETE) হ্যান্ডেল করতে পারে।

২. লজিক ও রেসপন্স (Logic & Response):
- 'NextRequest' অবজেক্টের মাধ্যমে ক্লায়েন্ট থেকে আসা রিকোয়েস্টের বডি, হেডার বা কুয়েরি প্যারামিটার এক্সট্রাক্ট করা হয়।
- ব্যাকএন্ড লজিক প্রসেস করার পর 'NextResponse.json()' এর মাধ্যমে JSON ফরম্যাটে ডেটা রিটার্ন করা হয়।

৩. ব্যবহারিক গুরুত্ব (Practical Significance):
এক্সটার্নাল সার্ভিস বা ক্লায়েন্ট-সাইড থেকে সরাসরি ডেটা আদান-প্রদানের জন্য এই API রাউটগুলো অপরিহার্য।
================================================================================
*/
