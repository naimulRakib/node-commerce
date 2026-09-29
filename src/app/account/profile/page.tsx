import { Metadata } from "next";
import { requireCustomer } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm, AddressManager } from "./ProfileClient";

export const metadata: Metadata = { title: "My Profile — NodeCommerce" };

export default async function ProfilePage() {
  const session = await requireCustomer();

  const [customerRes, profileRes, addressesRes] = await Promise.all([
    db.query('SELECT name, email, phone FROM customer WHERE customer_id = $1', [session.id]),
    db.query('SELECT * FROM profile WHERE customer_id = $1', [session.id]),
    db.query('SELECT * FROM address WHERE customer_id = $1 ORDER BY is_default DESC, created_at ASC', [session.id])
  ]);

  const customer = customerRes.rows[0];
  const profile = profileRes.rows[0] || null;
  const addresses = addressesRes.rows;

  return (
    <div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 28, color: "white", marginBottom: 28 }}>My Profile</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Profile Info */}
        <div style={{ background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 8 }}>
            Personal Information
          </h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 24 }}>Email: {customer?.email}</p>
          <ProfileForm
            profile={{ full_name: profile?.full_name ?? null, gender: profile?.gender ?? null, date_of_birth: profile?.date_of_birth?.toISOString().split("T")[0] ?? null }}
            phone={customer?.phone ?? null}
            name={customer?.name ?? ""}
          />
        </div>

        {/* Addresses */}
        <div style={{ background: "rgba(22,22,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 28 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, color: "white", fontSize: 18, marginBottom: 20 }}>
            Saved Addresses
          </h2>
          <AddressManager addresses={addresses.map(a => ({
            address_id: a.address_id, label: a.label, address_line1: a.address_line1,
            city: a.city, district: a.district, is_default: a.is_default,
          }))} />
        </div>
      </div>
    </div>
  );
}


/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি নেক্সট.জেএস (Next.js) অ্যাপ রাউটারের (App Router) একটি রুট পেজ (Page Component)। ফোল্ডার স্ট্রাকচারের উপর ভিত্তি করে নেক্সট.জেএস স্বয়ংক্রিয়ভাবে এর রাউটিং (File-system based Routing) তৈরি করে। এটি সাধারণত একটি সার্ভার কম্পোনেন্ট (Server Component), যা ব্রাউজারে যাওয়ার আগেই সার্ভারে রেন্ডার (SSR) হয়।

২. লজিক ও ডেটা ফ্লো (Logic & Data Flow):
- পেজ কম্পোনেন্টগুলো সরাসরি ডেটাবেস বা এক্সটার্নাল API থেকে ডেটা ফেচ (Fetch) করতে পারে, কারণ এগুলো সার্ভারে রান হয়।
- প্রপস হিসেবে এটি রাউটের 'params' (যেমন: /products/[id]) এবং 'searchParams' (যেমন: ?page=2) গ্রহণ করে।
- ডেটা ফেচিং শেষে এটি UI রেন্ডার করে ক্লায়েন্টে পাঠায়।

৩. ব্যবহারিক গুরুত্ব (Practical Significance):
সার্ভার-সাইড রেন্ডারিংয়ের ফলে ফার্স্ট কন্টেন্টফুল পেইন্ট (First Contentful Paint) ফাস্ট হয় এবং সার্চ ইঞ্জিন অপটিমাইজেশন (SEO) অত্যন্ত ভালো হয়।
================================================================================
*/
