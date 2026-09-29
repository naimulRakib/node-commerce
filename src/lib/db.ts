// 'pg' (node-postgres) লাইব্রেরি থেকে 'Pool' ক্লাসটি ইমপোর্ট করা হচ্ছে।
// এটি ডাটাবেস সংযোগ (Database Connection) পুলিং পরিচালনা করতে ব্যবহৃত হয়।
import { Pool } from 'pg';

// একটি গ্লোবাল অবজেক্ট (Global Object) তৈরি করা হচ্ছে যা পুলের রেফারেন্স সংরক্ষণ করবে।
// ডেভেলপমেন্ট পরিবেশে (Development Environment) হট-রিলোডিংয়ের (Hot-reloading) সময় 
// বারবার নতুন ডাটাবেস সংযোগ তৈরি হওয়া রোধ করতে এই Singleton প্যাটার্নটি অপরিহার্য।
const globalForPg = globalThis as unknown as { pool: Pool };

// 'pool' নামক একটি এক্সপোর্টেড (Exported) ভেরিয়েবল তৈরি করা হচ্ছে।
// এটি প্রথমে গ্লোবাল অবজেক্টে বিদ্যমান পুল খোঁজার চেষ্টা করে।
export const pool =
  globalForPg.pool ||
  // যদি গ্লোবাল পুল না থাকে, তবে এনভায়রনমেন্ট ভেরিয়েবল (DATABASE_URL) ব্যবহার করে 
  // একটি নতুন 'Pool' ইনস্ট্যান্স (Instance) তৈরি করে।
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // প্রয়োজনে এখানে অন্যান্য কনফিগারেশন যেমন max_connections বা idleTimeoutMillis যুক্ত করা যায়।
  });

// প্রোডাকশন (Production) পরিবেশ ছাড়া অন্য সকল ক্ষেত্রে, নতুন তৈরি করা পুলটি 
// গ্লোবাল অবজেক্টে সংরক্ষণ করা হচ্ছে যাতে পরবর্তী হট-রিলোডে এটি পুনরায় ব্যবহৃত হয়।
if (process.env.NODE_ENV !== "production") globalForPg.pool = pool;

// pg পুল ইভেন্ট হ্যান্ডলার: ডাটাবেস অফলাইন থাকলে (ECONNREFUSED) idle client থেকে
// 'error' ইভেন্ট ফায়ার হয়, যা হ্যান্ডেল না করলে uncaughtException ক্র্যাশ ঘটায়।
// এই হ্যান্ডলার সেটি ধরে রাখে এবং Next.js-এর এরর বাউন্ডারিতে পৌঁছাতে দেয় না।
pool.on('error', (err: Error) => {
  // শুধু ডেভেলপমেন্টে লগ করা হবে।
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[DB Pool] Idle client error (database may be offline):', err.message);
  }
});

// পূর্বের ORM (Prisma) নির্ভরতা থেকে কোডবেস মাইগ্রেশনের (Codebase Migration) সময় 
// ব্যাকওয়ার্ড কম্প্যাটিবিলিটি (Backward Compatibility) বজায় রাখার জন্য 'db' নামক একটি অবজেক্ট এক্সপোর্ট করা হচ্ছে।
export const db = {
  // 'query' মেথডটি সরাসরি ডাটাবেসে র (raw) SQL কুয়েরি (SQL Query) এবং প্যারামিটার (Parameters) এক্সিকিউট (Execute) করে।
  query: (text: string, params?: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\x1b[36m[DB QUERY]\x1b[0m ${text.replace(/\s+/g, ' ').trim()}`);
      if (params && params.length > 0) {
        console.log(`\x1b[33m[DB PARAMS]\x1b[0m`, params);
      }
    }
    return pool.query(text, params);
  },
};

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/lib/db.ts`) মূলত একটি ডাটাবেস কানেকশন ম্যানেজার (Database Connection Manager) হিসেবে কাজ করে। 
এটি 'node-postgres' (`pg`) লাইব্রেরির কানেকশন পুলিং (Connection Pooling) ফিচার ব্যবহার করে। 
পুলিং এর মূল উদ্দেশ্য হলো ডাটাবেসের সাথে সংযুক্ত হওয়ার ওভারহেড (Overhead) কমানো। 
এটি একটি নির্দিষ্ট সংখ্যক সংযোগ আগে থেকেই তৈরি করে রাখে (TCP/IP Handshake অপ্টিমাইজেশন) এবং অ্যাপ্লিকেশন যখনই কুয়েরি করতে চায়, 
তখন পুল থেকে একটি বিদ্যমান সংযোগ ধার (borrow) করে। ডেভেলপমেন্ট পরিবেশে (Development environment) নেক্সট.জেএস (Next.js) 
এর ফাস্ট রিফ্রেশ (Fast Refresh) বা হট-রিলোডিং মেকানিজম প্রতিবার ফাইল সেভ করার সময় কানেকশন লিকেজ (Connection Leakage) ঘটাতে পারে।
 এটি রোধ করার জন্য 'Singleton Pattern' প্রয়োগ করা হয়েছে `globalThis` অবজেক্টের মাধ্যমে।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এই ফাইলে সরাসরি কোনো ইউজার প্রমাণীকরণ (User Authentication) নেই, 
তবে এটি সিস্টেম লেভেল অথেনটিকেশনের (System Level Authentication) জন্য এনভায়রনমেন্ট ভেরিয়েবল (`process.env.DATABASE_URL`) এর উপর নির্ভর করে।
 কানেকশন স্ট্রিংটি সোর্স কোডের বাইরে সুরক্ষিত থাকায় ক্রেডেনশিয়াল এক্সপোজার (Credential Exposure) এর ঝুঁকি থাকে না।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই ফাইলটি কোনো এক্সটার্নাল HTTP API কল করে না। এটি ইন্টারনাল ডাটাবেস এপিআই (Internal Database API) হিসেবে কাজ করে।
 `db.query` মেথডটি একটি র‍্যাপার (Wrapper) ফাংশন হিসেবে কাজ করে যা 
সরাসরি `pool.query` কে ইনভোক (Invoke) করে। যখন কোনো রিকোয়েস্ট আসে, `db.query` 
একটি SQL স্ট্রিং এবং ঐচ্ছিক প্যারামিটার অ্যারে (Parameterized Values) গ্রহণ করে। এই প্যারামিটারাইজড কুয়েরি 
(Parameterized Queries) ম্যাকানিজমটি এসকিউএল ইনজেকশন (SQL Injection) আক্রমণ থেকে ডাটাবেসকে শতভাগ সুরক্ষিত রাখে। 
ডেটা প্রবাহ (Data flow) সার্ভার থেকে ডাটাবেস এবং ডাটাবেস থেকে সার্ভারে অ্যাসিঙ্ক্রোনাসভাবে (Asynchronously) সংঘটিত হয়।
================================================================================
*/
