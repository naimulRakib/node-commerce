// 'jose' লাইব্রেরি থেকে JSON Web Token (JWT) তৈরি (SignJWT) এবং যাচাই (jwtVerify) করার মডিউলগুলো ইমপোর্ট করা হচ্ছে।
// এটি ক্রিপ্টোগ্রাফিক অ্যালগরিদম ব্যবহার করে ডেটা এনক্রিপ্ট ও ডিক্রিপ্ট করতে সহায়তা করে।
import { SignJWT, jwtVerify } from "jose";
// নেক্সট.জেএস (Next.js) এর সার্ভার-সাইড কুকি (Server-Side Cookies) পরিচালনার জন্য 'cookies' মডিউলটি ইমপোর্ট করা হচ্ছে।
import { cookies } from "next/headers";
// প্রমাণীকরণ ব্যর্থ হলে ব্যবহারকারীকে অন্য পৃষ্ঠায় রিডাইরেক্ট (Redirect) করার জন্য 'redirect' ফাংশনটি আনা হয়েছে।
import { redirect } from "next/navigation";

// এনভায়রনমেন্ট ভেরিয়েবল (Environment Variable) থেকে JWT এর সিক্রেট কি (Secret Key) গ্রহণ করা হচ্ছে।
// যদি এটি না থাকে, তবে একটি ফলব্যাক (Fallback) সিক্রেট ব্যবহার করা হবে। 'TextEncoder' এটিকে বাইট অ্যারেতে (Byte Array) রূপান্তর করে।
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-prod"
);

// সেশনের পেলোড (Session Payload) বা ব্যবহারকারীর তথ্য সংরক্ষণের টাইপ ডেফিনেশন (Type Definition)।
// এটি টাইপস্ক্রিপ্টকে (TypeScript) অবজেক্টের গঠন (Data Structure) সম্পর্কে সচেতন করে।
export type SessionPayload = {
  id: number;
  email: string;
  name: string;
  role: "customer" | "admin" | "super_admin";
};

// ─── টোকেন তৈরি (Token creation) ───────────────────────────────────────────
// এই অ্যাসিনক্রোনাস (Asynchronous) ফাংশনটি ব্যবহারকারীর তথ্য (Payload) গ্রহণ করে একটি এনক্রিপ্টেড JWT স্ট্রিং তৈরি করে।
export async function createSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" }) // 'HS256' ক্রিপ্টোগ্রাফিক হ্যাশিং অ্যালগরিদম (Hashing Algorithm) নির্ধারণ করা হয়েছে।
    .setIssuedAt() // টোকেনটি ইস্যু করার সময়কাল (Timestamp) যুক্ত করা হচ্ছে।
    .setExpirationTime("7d") // টোকেনটির মেয়াদ (Expiration) ৭ দিন নির্ধারণ করা হয়েছে।
    .sign(JWT_SECRET); // সিক্রেট কি (Secret Key) দ্বারা টোকেনটিকে ডিজিটালভাবে স্বাক্ষর (Digitally Sign) করা হচ্ছে।
}

// ─── টোকেন যাচাইকরণ (Token verification) ───────────────────────────────────────
// এই ফাংশনটি ক্লায়েন্ট থেকে প্রাপ্ত টোকেনের ক্রিপ্টোগ্রাফিক বৈধতা (Cryptographic Validity) যাচাই করে।
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    // 'jwtVerify' মেথডটি সিক্রেট কি ব্যবহার করে টোকেনটি ডিকোড (Decode) এবং যাচাই করে।
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // যাচাই সফল হলে, এক্সট্রাক্টেড ডেটাকে 'SessionPayload' টাইপে রূপান্তর (Type Cast) করে ফেরত (Return) দেওয়া হয়।
    return payload as unknown as SessionPayload;
  } catch {
    // টোকেন অবৈধ বা মেয়াদোত্তীর্ণ হলে ত্রুটি (Exception) ধরা পড়ে এবং 'null' ফেরত দেওয়া হয়।
    return null;
  }
}

// ─── বর্তমান সেশন পুনরুদ্ধার (Get current session) ───────────────────────
// সার্ভার-সাইড রিকোয়েস্ট থেকে কুকি পার্স (Parse) করে বর্তমান সেশন বের করার ফাংশন।
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  // 'session' নামক কুকিটি অনুসন্ধান করা হচ্ছে।
  const token = cookieStore.get("session")?.value;
  // কুকি না থাকলে 'null' ফেরত দেওয়া হয়।
  if (!token) return null;
  // কুকি থাকলে তা যাচাই (verify) করে পেলোড (Payload) ফেরত দেওয়া হয়।
  return verifyToken(token);
}

// ─── সেশন কুকি সংরক্ষণ (Set session cookie) ───────────────────────────────────────
// ব্যবহারকারী লগইন করার পর ব্রাউজারে সুরক্ষিত কুকি (Secure Cookie) সেট করার ফাংশন।
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true, // ক্লায়েন্ট-সাইড জাভাস্ক্রিপ্ট (যেমন: XSS আক্রমণ) থেকে কুকিটি লুকিয়ে রাখে।
    secure: process.env.NODE_ENV === "production", // শুধুমাত্র HTTPS প্রোটোকলে (প্রোডাকশন পরিবেশে) কুকি আদান-প্রদান নিশ্চিত করে।
    sameSite: "lax", // সিএসআরএফ (CSRF) আক্রমণ প্রতিরোধ করার জন্য 'SameSite' পলিসি নির্ধারণ করে।
    path: "/", // ডোমেইনের সকল পাথে (Path) কুকিটি কাজ করবে।
    maxAge: 60 * 60 * 24 * 7, // কুকিটির সর্বোচ্চ আয়ুষ্কাল ৭ দিন (সেকেন্ডে হিসাবকৃত)।
  });
}

// ─── সেশন কুকি মুছে ফেলা (Clear session cookie) ─────────────────────────────────────
// লগআউট (Logout) করার সময় সেশন কুকি ব্রাউজার থেকে মুছে ফেলার (Delete) ফাংশন।
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// ─── অ্যাক্সেস নিয়ন্ত্রণ গার্ড (Access Control Guards) ───────────────────────────────────────────────────
// যেকোনো লগ-ইন করা ব্যবহারকারীর জন্য রাউট প্রটেক্ট (Protect) করার ফাংশন।
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  // সেশন না থাকলে রিডাইরেক্ট করে লগইন পৃষ্ঠায় পাঠানো হয়।
  if (!session) redirect("/login");
  return session;
}

// শুধুমাত্র অ্যাডমিনিস্ট্রেটরদের (Admin/Super Admin) জন্য রাউট প্রটেক্ট করার ফাংশন (Role-Based Access Control - RBAC)।
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  // ব্যবহারকারীর ভূমিকা (Role) যাচাই করে অনুমোদনহীন (Unauthorized) অ্যাক্সেস ব্লক করা হয়।
  if (!session || !["admin", "super_admin"].includes(session.role)) {
    redirect("/admin/login");
  }
  return session;
}

// শুধুমাত্র গ্রাহকদের (Customers) জন্য রাউট প্রটেক্ট করার ফাংশন।
export async function requireCustomer(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "customer") redirect("/login");
  return session;
}

/*
================================================================================
একাডেমিক বিশ্লেষণ (Academic Documentation)
================================================================================

১. কার্যপ্রণালী (Methodology):
এই ফাইলটি (`src/lib/auth.ts`) সমগ্র অ্যাপ্লিকেশনটির পরিচয় ও অ্যাক্সেস ব্যবস্থাপনা (Identity and Access Management - IAM) এর মূল কেন্দ্রবিন্দু (Core Module)। এটি 'jose' লাইব্রেরি ব্যবহার করে স্টেটলেস (Stateless) JSON Web Tokens (JWT) তৈরি এবং ক্রিপ্টোগ্রাফিকভাবে (Cryptographically) যাচাই করে। এখানে সার্ভার-সাইড কুকি (Server-Side Cookies) ম্যানিপুলেশনের মাধ্যমে প্রমাণীকরণ টোকেনগুলো ক্লায়েন্ট ব্রাউজারে সুরক্ষিতভাবে সংরক্ষণ এবং রিড (Read) করা হয়। 

এছাড়াও, এটি বেশ কিছু 'Guard' ফাংশন (`requireAuth`, `requireAdmin`, `requireCustomer`) সরবরাহ করে, যা মিডলওয়্যার (Middleware) বা সার্ভার কম্পোনেন্টগুলোতে ইনজেক্ট (Inject) করে রোল-ভিত্তিক অ্যাক্সেস কন্ট্রোল (Role-Based Access Control - RBAC) বাস্তবায়ন করা হয়।

২. প্রমাণীকরণ ও নিরাপত্তা (Authentication & Security):
এই মডিউলটি সাইবার নিরাপত্তার বেশ কয়েকটি সর্বোত্তম অনুশীলন (Best Practices) কঠোরভাবে মেনে চলে:
- **এইচএমএসি অ্যালগরিদম (HMAC Algorithm)**: টোকেন স্বাক্ষর (Signing) করার জন্য `HS256` (HMAC with SHA-256) ব্যবহার করা হয়, যা ডেটা টেম্পারিং (Data Tampering) প্রতিরোধ করে।
- **এইচটিটিপি-ওনলি কুকিজ (HttpOnly Cookies)**: টোকেনগুলো `httpOnly` ফ্ল্যাগসহ সেট করা হয়, যার ফলে ক্রস-সাইট স্ক্রিপ্টিং (Cross-Site Scripting - XSS) আক্রমণের মাধ্যমে কোনো ম্যালিশিয়াস জাভাস্ক্রিপ্ট টোকেন চুরি করতে পারে না।
- **সিকিউর ট্রান্সমিশন (Secure Transmission)**: প্রোডাকশন (Production) পরিবেশে `secure: true` ফ্ল্যাগ ব্যবহার করে নিশ্চিত করা হয় যে টোকেনটি শুধুমাত্র এনক্রিপ্টেড HTTPS কানেকশনেই আদান-প্রদান হবে (Man-in-the-Middle Attack প্রতিরোধ)।
- **সিএসআরএফ প্রশমন (CSRF Mitigation)**: `sameSite: "lax"` কনফিগারেশনের মাধ্যমে ক্রস-সাইট রিকোয়েস্ট ফোরজারি (Cross-Site Request Forgery) আক্রমণ সীমিত করা হয়েছে।

৩. এপিআই ও উপাত্ত প্রবাহ (API & Data Flow):
এই ফাইলটি কোনো এক্সটার্নাল এপিআই-এর সাথে ডেটা আদান-প্রদান করে না, বরং অভ্যন্তরীণ প্রমাণীকরণ মেকানিজম (Internal Authentication Mechanism) হিসেবে কাজ করে। যখন কোনো ইউজার লগইন করে, তখন ডাটাবেস ভেরিফিকেশনের পর একটি পেলোড (Payload) `createSession` এ পাঠানো হয়। এটি টোকেন তৈরি করে `setSessionCookie` এর মাধ্যমে ব্রাউজারে পাঠায়। পরবর্তীতে, প্রতিটি সুরক্ষিত রিকোয়েস্টে সার্ভার `getSession` ফাংশন কল করে ব্রাউজার থেকে কুকি রিড করে এবং `verifyToken` এর মাধ্যমে এর পেলোড ডিকোড (Decode) করে। এই প্রক্রিয়ায় সার্ভারকে ডাটাবেসে অতিরিক্ত কুয়েরি (Query) করতে হয় না (Zero-Database-Lookup Authentication), যা সার্ভারের কর্মক্ষমতা (Performance) বহুগুণ বৃদ্ধি করে।
================================================================================
*/
