import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedTable = searchParams.get("table") || "customer";

    // 1. Get all public table names
    const tablesRes = await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name ASC`
    );
    const tableList = tablesRes.rows.map((r) => r.table_name);

    // Sanitize selectedTable to prevent SQL injection
    if (!tableList.includes(selectedTable)) {
      return NextResponse.json({ error: "Invalid table name" }, { status: 400 });
    }

    // 2. Get columns of selected table
    const columnsRes = await db.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'`,
      [selectedTable]
    );

    // 3. Get rows of selected table (limit 50)
    const rowsRes = await db.query(`SELECT * FROM "${selectedTable}" LIMIT 50`);

    return NextResponse.json({
      tables: tableList,
      currentTable: selectedTable,
      columns: columnsRes.rows,
      rows: rowsRes.rows,
      count: rowsRes.rows.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
