"use client";

import { useEffect, useState } from "react";

interface DbStatus {
  status: "connected" | "disconnected" | "loading";
  database?: {
    name: string;
    time: string;
    total_customers: number;
  };
  error?: string;
}

export default function DbStatusBadge() {
  const [dbStatus, setDbStatus] = useState<DbStatus>({ status: "loading" });
  const [expanded, setExpanded] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/db-status");
      const data = await res.json();
      if (res.ok) {
        setDbStatus(data);
      } else {
        setDbStatus({ status: "disconnected", error: data.error });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setDbStatus({ status: "disconnected", error: message });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatus();
    // Poll status every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      <div
        onClick={() => setExpanded(!expanded)}
        className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border backdrop-blur-md transition-all duration-300 text-xs font-semibold ${
          dbStatus.status === "connected"
            ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900"
            : dbStatus.status === "loading"
            ? "bg-amber-950/80 border-amber-500/50 text-amber-300 hover:bg-amber-900"
            : "bg-rose-950/80 border-rose-500/50 text-rose-300 hover:bg-rose-900"
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              dbStatus.status === "connected"
                ? "bg-emerald-400"
                : dbStatus.status === "loading"
                ? "bg-amber-400"
                : "bg-rose-400"
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              dbStatus.status === "connected"
                ? "bg-emerald-500"
                : dbStatus.status === "loading"
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
          ></span>
        </span>

        <span>
          {dbStatus.status === "connected"
            ? `PostgreSQL Connected (${dbStatus.database?.name})`
            : dbStatus.status === "loading"
            ? "Connecting to DB..."
            : "DB Disconnected"}
        </span>
      </div>

      {expanded && (
        <div className="mt-2 p-3 w-64 bg-gray-900/95 border border-gray-800 rounded-xl shadow-2xl text-xs text-gray-300 backdrop-blur-md">
          <div className="flex justify-between items-center pb-2 border-b border-gray-800 mb-2">
            <span className="font-bold text-white">Database Info</span>
            <button
              onClick={fetchStatus}
              className="text-[10px] bg-gray-800 hover:bg-gray-700 px-2 py-0.5 rounded text-gray-300"
            >
              Refresh
            </button>
          </div>
          {dbStatus.status === "connected" && dbStatus.database ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Database Name:</span>
                <span className="font-mono text-emerald-400">{dbStatus.database.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Customers:</span>
                <span className="font-mono text-indigo-400">{dbStatus.database.total_customers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">DB Time:</span>
                <span className="font-mono text-xs text-gray-300">
                  {new Date(dbStatus.database.time).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-rose-400 text-xs">{dbStatus.error || "Unable to reach database."}</p>
          )}
        </div>
      )}
    </div>
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
