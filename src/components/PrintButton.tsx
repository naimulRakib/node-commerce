"use client";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="print-btn"
      style={{ 
        background: "#f8fafc", 
        border: "1px solid #cbd5e1", 
        padding: "8px 16px", 
        borderRadius: 8, 
        fontSize: 13, 
        fontWeight: 600, 
        color: "#475569", 
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8
      }}
    >
      <span style={{ fontSize: 16 }}>🖨️</span> Print Invoice
    </button>
  );
}


/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এটি একটি রিঅ্যাক্ট (React) কম্পোনেন্ট, যা ইউজার ইন্টারফেস (UI) এর একটি পুনঃব্যবহারযোগ্য (Reusable) অংশ। কম্পোনেন্ট-ভিত্তিক আর্কিটেকচার (Component-based Architecture) সফটওয়্যার ইঞ্জিনিয়ারিংয়ে কোড ডুপ্লিকেশন (Code Duplication) কমায় এবং মেইনটেইনেবিলিটি বাড়ায়।

২. লজিক ও প্রপস (Logic & Props):
এই কম্পোনেন্টটি প্যারেন্ট কম্পোনেন্ট থেকে ডেটা বা ফাংশন 'Props' (Properties) হিসেবে গ্রহণ করতে পারে। এর নিজস্ব স্টেট (State) বা ইফেক্ট (Effect) থাকতে পারে যদি এটি ক্লায়েন্ট কম্পোনেন্ট হয়। JSX (JavaScript XML) সিনট্যাক্স ব্যবহার করে এর UI ডিফাইন করা হয়েছে।

৩. ব্যবহারিক গুরুত্ব (Practical Significance):
UI কে ছোট ছোট লজিক্যাল ব্লকে ভাগ করার ফলে বড় অ্যাপ্লিকেশন ডেভেলপমেন্ট সহজ হয়। বাটন, কার্ড, বা ইনপুটের মতো এলিমেন্টগুলো একবার বানিয়ে পুরো প্রোজেক্টে ব্যবহার করা যায়।
================================================================================
*/
