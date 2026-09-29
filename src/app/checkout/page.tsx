// 'next' থেকে Metadata টাইপ ইমপোর্ট করা হচ্ছে, যা এসইও (SEO) অপ্টিমাইজেশনের জন্য ব্যবহৃত হয়।
import { Metadata } from "next";
// ব্যবহারকারীকে নির্দিষ্ট রাউটে (Route) নেভিগেট বা রিডাইরেক্ট (Redirect) করার জন্য।
import { redirect } from "next/navigation";
// ডেটাবেসের সাথে সরাসরি যোগাযোগ স্থাপনের জন্য 'db' অবজেক্টটি ইমপোর্ট করা হচ্ছে।
import { db } from "@/lib/db";
// ব্যবহারকারীর সেশন এবং প্রমাণীকরণ (Authentication) যাচাই করার জন্য।
import { getSession } from "@/lib/auth";
// শেয়ারড কম্পোনেন্টগুলো (Shared Components) ইমপোর্ট করা হচ্ছে।
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
// ইন্টারঅ্যাক্টিভ চেকআউট ফর্ম এবং লজিক ধারণকারী ক্লায়েন্ট কম্পোনেন্টটি ইমপোর্ট করা হচ্ছে।
import CheckoutClient from "./CheckoutClient";

// ─── মেটাডেটা কনফিগারেশন (Metadata Configuration) ───────────────────────────
// এই পেইজের টাইটেল এবং ডেসক্রিপশন সেট করা হচ্ছে, যা সার্চ ইঞ্জিন অপ্টিমাইজেশন (SEO) এবং ব্রাউজার ট্যাবে দৃশ্যমান হয়।
export const metadata: Metadata = {
  title: "Checkout — NodeCommerce",
  description: "Complete your purchase securely.",
};

// ─── সার্ভার কম্পোনেন্ট (Server Component) ───────────────────────────
// এটি একটি অ্যাসিঙ্ক্রোনাস (Asynchronous) সার্ভার-সাইড রেন্ডারড (SSR) কম্পোনেন্ট। 
// এটি পেজ লোড হওয়ার আগেই সার্ভার থেকে ডেটা ফেচ (Fetch) করে।
export default async function CheckoutPage() {
  // ১. সেশন ভ্যালিডেশন (Session Validation): ব্যবহারকারীর লগইন স্ট্যাটাস এবং রোল (Role) যাচাই করা হচ্ছে।
  const session = await getSession();
  // যদি ব্যবহারকারী লগ-ইন না থাকে বা 'customer' না হয়, তবে তাকে লগইন পেজে রিডাইরেক্ট করা হবে (Access Control)।
  if (!session || session.role !== "customer") redirect("/login");

  // ২. প্যারালাল ডেটা ফেচিং (Parallel Data Fetching): 
  // 'Promise.all' ব্যবহার করে একই সাথে (Concurrently) কার্ট, ঠিকানা এবং কুরিয়ার লিস্ট আনা হচ্ছে 
  // যাতে পেজ রেন্ডারিং এর লেটেন্সি (Latency) কমানো যায়।
  const [cartRes, addressesRes, couriersRes] = await Promise.all([
    db.query('SELECT cart_id FROM cart WHERE customer_id = $1', [session.id]),
    db.query('SELECT * FROM address WHERE customer_id = $1 ORDER BY is_default DESC, created_at ASC', [session.id]),
    db.query('SELECT * FROM courier WHERE is_active = true ORDER BY name ASC'),
  ]);

  let cartItems: any[] = [];
  // ৩. কার্টের আইটেম ফেচিং (Cart Item Fetching):
  if (cartRes.rows.length > 0) {
    // কার্ট পাওয়া গেলে 'JOIN' অপারেশন ব্যবহার করে প্রোডাক্ট এবং ভ্যারিয়েন্টের মূল্য (Price) আনা হচ্ছে।
    const itemsRes = await db.query(`
      SELECT ci.quantity, p.base_price
      FROM cart_item ci
      JOIN product p ON ci.product_id = p.product_id
      LEFT JOIN product_variant v ON ci.variant_code = v.variant_code
      WHERE ci.cart_id = $1
    `, [cartRes.rows[0].cart_id]);
    cartItems = itemsRes.rows;
  }

  // ৪. এম্পটি কার্ট ভ্যালিডেশন (Empty Cart Validation):
  // চেকআউট পেজে আসার পর যদি দেখা যায় কার্টে কোনো পণ্য নেই, তবে ব্যবহারকারীকে কার্ট পেজে ফিরিয়ে দেওয়া হবে।
  if (cartItems.length === 0) redirect("/cart");

  // ৫. সাবটোটাল ক্যালকুলেশন (Subtotal Calculation):
  // 'reduce' অ্যালগরিদম ব্যবহার করে কার্টের সকল পণ্যের মোট মূল্য (Total Price) সার্ভার-সাইডেই হিসাব করা হচ্ছে।
  const subtotal = cartItems.reduce((sum, item) => {
    // বেস প্রাইস (base_price) ব্যবহার করা হবে।
    const price = item.base_price;
    return sum + Number(price) * item.quantity;
  }, 0);

  // কুয়েরি রেসপন্স থেকে ডেটাগুলো এক্সট্রাক্ট (Extract) করা হচ্ছে।
  const addresses = addressesRes.rows;
  const couriers = couriersRes.rows;

  // ৬. ইউজার ইন্টারফেস (User Interface - UI) রেন্ডারিং:
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80, minHeight: "100vh" }}>
        {/* পেইজের হেডার বা হিরো সেকশন (Hero Section) */}
        <div style={{
          background: "linear-gradient(180deg, rgba(234,179,8,0.04) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "36px 0 28px",
        }}>
          <div className="container">
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 32, color: "white", marginBottom: 6 }}>
              Checkout
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
              Step 2 of 2 — Complete your order
            </p>
          </div>
        </div>

        {/* মূল চেকআউট কন্টেইনার (Checkout Container) */}
        <div className="container" style={{ padding: "32px 24px" }}>
          {/* 
            ৭. ক্লায়েন্ট কম্পোনেন্টে প্রপস পাসিং (Props Passing): 
            সংগৃহীত ঠিকানা, কুরিয়ার এবং কার্টের ডেটা 'CheckoutClient' এ পাঠানো হচ্ছে, 
            যাতে ক্লায়েন্ট-সাইডে ফর্ম সাবমিশন এবং ইন্টারঅ্যাক্টিভিটি (Interactivity) পরিচালনা করা যায়।
          */}
          <CheckoutClient
            addresses={addresses.map(a => ({
              address_id: a.address_id,
              label: a.label,
              address_line1: a.address_line1,
              city: a.city,
              district: a.district,
              is_default: a.is_default,
            }))}
            couriers={couriers.map(c => ({
              courier_id: c.courier_id,
              name: c.name,
            }))}
            cart={{ subtotal, itemCount: cartItems.length }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/checkout/page.tsx`) নেক্সট.জেএস (Next.js) এর সার্ভার কম্পোনেন্ট (Server Component) আর্কিটেকচার ব্যবহার করে তৈরি করা হয়েছে। এটি মূলত একটি ডেটা ফেচার (Data Fetcher) এবং রাউটার (Router) হিসেবে কাজ করে। ক্লায়েন্টকে HTML রেন্ডার করার পূর্বেই এটি সার্ভার-সাইডে ডেটাবেস থেকে প্রয়োজনীয় সকল ডেটা (ঠিকানা, কুরিয়ার লিস্ট, কার্ট আইটেম) সংগ্রহ করে। এখানে `Promise.all` ব্যবহার করে কনকারেন্ট (Concurrent) ডেটা ফেচিং বাস্তবায়ন করা হয়েছে, যা I/O বাউন্ডিং (I/O Bounding) সময় কমিয়ে পেজ লোড টাইম (Page Load Time) অপ্টিমাইজ করে। 

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
পেজটি লোড হওয়ার একদম শুরুতেই `getSession()` এর মাধ্যমে প্রমাণীকরণ (Authentication) এবং `session.role !== "customer"` এর মাধ্যমে ভূমিকা-ভিত্তিক অ্যাক্সেস কন্ট্রোল (Role-Based Access Control - RBAC) প্রয়োগ করা হয়েছে। অনুমোদনহীন ব্যবহারকারী সরাসরি চেকআউট পেজে অ্যাক্সেস করতে চাইলে তাকে লগইন পেজে রিডাইরেক্ট (Redirect) করা হয় (Route Guarding)। এছাড়া, ডেটাবেস কুয়েরিগুলো প্যারামিটারাইজড (Parameterized, e.g., `$1`) হওয়ায় এসকিউএল ইনজেকশন (SQL Injection) আক্রমণের কোনো সুযোগ নেই।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই পেজটিতে কোনো প্রথাগত (Traditional) REST API কল করা হয়নি। সার্ভার কম্পোনেন্ট হওয়ার কারণে এটি সরাসরি `db.query` ব্যবহার করে ডেটাবেস লেয়ারের সাথে যোগাযোগ করে। ডেটা প্রবাহ (Data Flow) এখানে একমুখী (Unidirectional - Top-down)। সার্ভার ডেটাবেস থেকে রিলেশনাল ডেটা (Relational Data) এক্সট্রাক্ট করে, সেগুলোকে ফিল্টার ও ফরম্যাট করে এবং পরিশেষে প্রপস (Props) হিসেবে `CheckoutClient` কম্পোনেন্টে ইনজেক্ট (Inject) করে। `CheckoutClient` পরবর্তীতে ইউজার ইন্টারফেস (UI) এবং ফর্ম হ্যান্ডলিং এর দায়িত্ব গ্রহণ করে।
================================================================================
*/
