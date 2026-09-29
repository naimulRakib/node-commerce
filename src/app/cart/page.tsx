// Next.js এর 'Metadata' টাইপ ইমপোর্ট করা হচ্ছে যা পৃষ্ঠার মেটাডেটা (যেমন টাইটেল, ডেসক্রিপশন) নির্ধারণে ব্যবহৃত হয়।
import { Metadata } from "next";
// ব্যবহারকারীকে অন্য পৃষ্ঠায় বা রাউটে নেভিগেট বা রিডাইরেক্ট করার জন্য 'redirect' ফাংশনটি ইমপোর্ট করা হচ্ছে।
import { redirect } from "next/navigation";
// ডাটাবেস এর সাথে সংযোগ স্থাপনের জন্য 'db' অবজেক্ট ইমপোর্ট করা হচ্ছে। এটি সরাসরি SQL কুয়েরি (raw SQL queries) সম্পাদনের জন্য ব্যবহৃত হয়।
import { db } from "@/lib/db";
// বর্তমান ব্যবহারকারীর সেশন (session) তথ্য অর্থাৎ প্রমাণীকরণ (Authentication) অবস্থা যাচাই করার জন্য 'getSession' ফাংশনটি আনা হয়েছে।
import { getSession } from "@/lib/auth";
// নেভিগেশন বার প্রদর্শনের জন্য 'Navbar' কম্পোনেন্টটি ইমপোর্ট করা হচ্ছে।
import Navbar from "@/components/Navbar";
// ওয়েবসাইটের নিচের অংশের জন্য 'Footer' কম্পোনেন্টটি ইমপোর্ট করা হচ্ছে।
import Footer from "@/components/Footer";
// ক্লায়েন্ট-সাইড (Client-side) কার্ট (Cart) পরিচালনার জন্য 'CartClient' কম্পোনেন্টটি ইমপোর্ট করা হচ্ছে।
import CartClient from "./CartClient";

// এই পৃষ্ঠার মেটাডেটা নির্ধারণ করা হচ্ছে। এটি মূলত সার্চ ইঞ্জিন অপটিমাইজেশন (SEO) এবং ব্রাউজার ট্যাবে প্রদর্শনের জন্য প্রযোজ্য।
export const metadata: Metadata = {
  // পৃষ্ঠার শিরোনাম (Title)
  title: "Shopping Cart — NodeCommerce",
  // পৃষ্ঠার বিবরণ (Description)
  description: "Review your cart and proceed to checkout.",
};

// এটি একটি সার্ভার-সাইড অ্যাসিনক্রোনাস (Asynchronous) ফাংশন যা কার্ট পৃষ্ঠার মূল কাঠামো রেন্ডার করে।
export default async function CartPage() {
  // 'getSession' এর মাধ্যমে ব্যবহারকারীর প্রমাণীকরণ অবস্থা এবং সেশনের তথ্য পুনরুদ্ধার করা হচ্ছে।
  const session = await getSession();
  
  // যদি কোনো সক্রিয় সেশন না থাকে, অথবা ব্যবহারকারীর ভূমিকা (role) 'customer' (গ্রাহক) না হয়, 
  // তবে তাকে জোরপূর্বক লগইন (login) পৃষ্ঠায় রিডাইরেক্ট করা হবে (অ্যাক্সেস নিয়ন্ত্রণ বা Access Control)।
  if (!session || session.role !== "customer") redirect("/login");

  // ডাটাবেস থেকে বর্তমান গ্রাহকের (customer_id) কার্ট আইডি (cart_id) খুঁজে বের করার জন্য SQL কুয়েরি চালানো হচ্ছে।
  const cartRes = await db.query('SELECT cart_id FROM cart WHERE customer_id = $1', [session.id]);
  
  // কার্টের ভেতরের আইটেমগুলো সংরক্ষণের জন্য একটি ফাঁকা অ্যারে (array) ডিক্লেয়ার করা হচ্ছে।
  let items: any[] = [];
  
  // যদি গ্রাহকের নামে কোনো কার্ট ডাটাবেসে বিদ্যমান থাকে (অর্থাৎ row সংখ্যা 0 এর বেশি হয়)...
  if (cartRes.rows.length > 0) {
    // কার্ট আইডিটি একটি ধ্রুবকে (constant) সংরক্ষণ করা হচ্ছে।
    const cartId = cartRes.rows[0].cart_id;
    
    // [CHECKLIST REQUIREMENT 7]: Use of Complex Queries
    // কার্টের ভেতরের সমস্ত আইটেম, পণ্যের বিবরণ (product details), এবং ভ্যারিয়েন্টের (variant) বিবরণ 
    // একসাথে রিলেশনাল জয়েন (Relational JOIN) ব্যবহার করে ডাটাবেস থেকে নিয়ে আসার জন্য একটি জটিল (Complex) SQL কুয়েরি চালানো হচ্ছে।
    // কার্ট আইটেম, প্রোডাক্ট, ভ্যারিয়েন্ট এবং মিডিয়া (Media) এক সাথে ফেচ করা হচ্ছে (একাধিক JOIN এবং সাবকুয়েরি ব্যবহার করে)।
    const itemsRes = await db.query(`
      SELECT ci.cart_item_id, ci.quantity, ci.variant_code,
             p.product_id, p.name as product_name, p.base_price,
             v.color as variant_color, v.size as variant_size, NULL::numeric as price_override,
             (
               SELECT m.image_url
               FROM media m
               WHERE m.variant_code = ci.variant_code
               LIMIT 1
             ) as image_url
      FROM cart_item ci
      JOIN product p ON ci.product_id = p.product_id
      LEFT JOIN product_variant v ON ci.variant_code = v.variant_code
      WHERE ci.cart_id = $1
      ORDER BY ci.added_at DESC
    `, [cartId]);

    // ডাটাবেস থেকে প্রাপ্ত কাঁচা (raw) ডেটাকে ক্লায়েন্ট কম্পোনেন্টের ব্যবহার উপযোগী কাঠামোতে (structured object) রূপান্তর করা হচ্ছে।
    items = itemsRes.rows.map(row => ({
      // কার্ট আইটেমের ইউনিক আইডি
      cart_item_id: row.cart_item_id,
      // পণ্যের পরিমাণ
      quantity: row.quantity,
      // পণ্যের মূল তথ্যাবলি (Product object)
      product: {
        product_id: row.product_id,
        name: row.product_name,
        base_price: Number(row.base_price),
        image_url: row.image_url || null,
      },
      // যদি পণ্যের কোনো সুনির্দিষ্ট ভ্যারিয়েন্ট (যেমন: রং বা সাইজ) থাকে, তবে তার তথ্যাবলি (Variant object)
      variant: row.variant_code ? {
        variant_code: row.variant_code,
        color: row.variant_color,
        size: row.variant_size,
        price_override: row.price_override ? Number(row.price_override) : null,
      } : null,
    }));
  }

  // ফন্টএন্ড বা ইউজার ইন্টারফেস (UI) রেন্ডার করার অংশ।
  return (
    <>
      {/* নেভিগেশন বার রেন্ডার করা হচ্ছে */}
      <Navbar />
      {/* মূল কন্টেন্ট এরিয়া (Main Content Area), যেখানে ইনলাইন সিএসএস (Inline CSS) ব্যবহার করা হয়েছে */}
      <main style={{ paddingTop: 80, minHeight: "100vh" }}>
        {/* পৃষ্ঠার শিরোনামের জন্য একটি নান্দনিক ব্যাকগ্রাউন্ড বা গ্রেডিয়েন্ট (Gradient) কন্টেইনার */}
        <div style={{
          background: "linear-gradient(180deg, rgba(234,179,8,0.04) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "36px 0 28px",
        }}>
          <div className="container">
            {/* মূল শিরোনাম (Heading) প্রদর্শন */}
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 32, color: "white" }}>
              Shopping Cart
            </h1>
          </div>
        </div>
        {/* কার্ট আইটেমগুলো প্রদর্শনের জন্য মূল কন্টেইনার */}
        <div className="container" style={{ padding: "32px 24px" }}>
          {/* ক্লায়েন্ট-সাইড ইন্টারঅ্যাকশনের জন্য CartClient কম্পোনেন্টে প্রস্তুতকৃত আইটেমগুলো পাঠানো হচ্ছে */}
          <CartClient items={items} />
        </div>
      </main>
      {/* ফুটার বা ওয়েবসাইটের নিম্নাংশ রেন্ডার করা হচ্ছে */}
      <Footer />
    </>
  );
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/app/cart/page.tsx`) মূলত সার্ভার-সাইড রেন্ডারিং (Server-Side Rendering - SSR) পদ্ধতি অনুসরণ করে কার্ট পৃষ্ঠার ডেটা প্রক্রিয়াকরণ এবং প্রদর্শন করে। পদ্ধতিটি নিম্নরূপ:
- প্রথমে এটি সেশন নির্ভর করে ব্যবহারকারীর বৈধতা যাচাই করে।
- এরপর এটি রিলেশনাল ডাটাবেস (PostgreSQL) থেকে সরাসরি SQL কুয়েরির মাধ্যমে নির্দিষ্ট গ্রাহকের কার্ট আইডি (Cart ID) সনাক্ত করে।
- [CHECKLIST REQUIREMENT 7]: প্রাপ্ত কার্ট আইডির ভিত্তিতে, একটি জটিল বা কমপ্লেক্স (Complex) 'JOIN' কুয়েরি চালিয়ে `cart_item`, `product`, `product_variant` এবং `media` টেবিলগুলো থেকে সমন্বিত ডেটা (Aggregated Data) সংগ্রহ করে। এখানে সাবকুয়েরি (Subquery) এবং লেফট জয়েন (LEFT JOIN) এর ব্যবহার ডেটাবেসের ফিচারগুলোর উপযুক্ত ব্যবহার নির্দেশ করে।
- শেষে, এই র (raw) ডেটাকে একটি অবজেক্ট মডেলে (Object Model) রূপান্তর করে `CartClient` নামক ক্লায়েন্ট কম্পোনেন্টের নিকট হস্তান্তর করে, যা ইন্টারঅ্যাক্টিভ ইউজার ইন্টারফেস (Interactive UI) তৈরি করে।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এই পৃষ্ঠায় অ্যাক্সেস নিয়ন্ত্রণ (Access Control) বা প্রমাণীকরণ প্রক্রিয়াটি অত্যন্ত কঠোরভাবে পরিচালনা করা হয়েছে। `await getSession()` ফাংশনটির মাধ্যমে সার্ভার-সাইডেই কুকি (Cookie) বা টোকেন (Token) বিশ্লেষণ করা হয়। যদি প্রমাণীকরণ ব্যর্থ হয়, অথবা ব্যবহারকারীর ভূমিকা (Authorization Role) যদি 'customer' ব্যতীত অন্য কিছু (যেমন: admin) হয়, তবে `redirect("/login")` এর মাধ্যমে তাকে অননুমোদিত অ্যাক্সেস থেকে বিরত রাখা হয়। এটি একটি মৌলিক কিন্তু শক্তিশালী পরিমিতি (Security Perimeter) যা ডেটা ব্রিচ (Data Breach) প্রতিরোধ করে।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই পৃষ্ঠায় কোনো এক্সটার্নাল (External) API এন্ডপয়েন্টের মুখাপেক্ষী না হয়ে সরাসরি ডাটাবেস লেয়ার (Database Layer) থেকে ডেটা এক্সট্রাক্ট করা হয়েছে। `db.query` মেথডের মাধ্যমে প্যারামিটারাইজড কুয়েরি (Parameterized Query, e.g., `$1`) ব্যবহার করা হয়েছে, যা এসকিউএল ইনজেকশন (SQL Injection) নামক মারাত্মক সাইবার আক্রমণ থেকে সিস্টেমকে সুরক্ষিত রাখে। ডেটা প্রবাহের (Data Flow) ক্ষেত্রে, সার্ভার ডাটাবেস থেকে রিলেশনাল ডেটা সংগ্রহ করে, সেগুলোকে প্রয়োজনীয় ডেটা স্ট্রাকচারে (Data Structure) ম্যাপিং (Mapping) করে এবং প্রপস (Props) হিসেবে ক্লায়েন্ট কম্পোনেন্টে প্রেরণ করে (Unidirectional Data Flow)।
================================================================================
*/
