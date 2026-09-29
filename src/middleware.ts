import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * ============================================================================
 * [CHECKLIST REQUIREMENT 1]: User Authentication (Handled by own code)
 * [CHECKLIST REQUIREMENT 2]: Authentication Validation on Every Page
 * 
 * ভাইভা বা ব্যাখ্যার জন্য (For Viva / Explanation):
 * এই ফাইলটি (middleware.ts) Next.js এর একটি গ্লোবাল মিডলওয়্যার। এটি অ্যাপ্লিকেশনের প্রতিটি
 * HTTP রিকোয়েস্ট (page view বা API call) সার্ভারে পৌঁছানোর ঠিক আগেই ইন্টারসেপ্ট (Intercept) করে। 
 * এর প্রধান কাজ হলো ইউজারের ব্রাউজার থেকে আসা কুকি চেক করা এবং সেটিতে থাকা JWT (JSON Web Token)
 * ভেরিফাই করা। যদি টোকেন না থাকে বা ভুল থাকে, তবে ইউজারকে লগইন পেজে রিডাইরেক্ট করা হয়। 
 * এটি "Authentication Validation on Every Page" চেকলিস্ট সরাসরি পূরণ করে কারণ এটি 
 * কোনো স্পেসিফিক পেজ নয়, বরং পুরো ওয়েবসাইটের প্রতিটি রাউটকে প্রটেক্ট করে। 
 * ============================================================================
 */

// JWT ডিক্রিপ্ট করার জন্য সিক্রেট কী (Secret Key) লোড করা হচ্ছে।
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-prod"
);

export async function middleware(request: NextRequest) {
  // ১. রিকোয়েস্ট থেকে 'session' নামের কুকিটা বের করে আনা হচ্ছে।
  const token = request.cookies.get('session')?.value;
  // ২. ইউজার কোন লিংকে (পাথে) যেতে চাচ্ছে তা বের করা হচ্ছে (যেমন: /cart বা /login)
  const path = request.nextUrl.pathname;

  // ৩. পাবলিক পাথগুলো (যেগুলোতে লগইন ছাড়াই যাওয়া যাবে) নির্ধারণ করা।
  const isPublicPath = path === '/login' || path === '/register' || path.startsWith('/api/auth');

  // যদি ইউজার এমন কোনো পেজে যেতে চায় যেটা পাবলিক নয় (অর্থাৎ লগইন দরকার)...
  if (!isPublicPath) {
    // টোকেন না থাকলে সরাসরি লগইন পেজে পাঠিয়ে দেওয়া হবে।
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      // 'jose' লাইব্রেরির jwtVerify ফাংশন দিয়ে টোকেনটি আসলেও ভ্যালিড কিনা তা চেক করা হচ্ছে।
      // এটি ক্রিপ্টোগ্রাফিক ভেরিফিকেশন, তাই টেম্পার (tamper) করা টোকেন এখানে ধরা পড়বে।
      await jwtVerify(token, JWT_SECRET);
    } catch (err) {
      // টোকেনের মেয়াদ শেষ (Expired) হলে বা ভুল টোকেন হলে আবার লগইন পেজে পাঠাবে।
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // যদি ইউজার আগে থেকেই লগইন করা থাকে (টোকেন ভ্যালিড) এবং সে আবার লগইন বা রেজিস্টার পেজে যেতে চায়...
  if (isPublicPath && token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      // তাকে সরাসরি হোমপেজে রিডাইরেক্ট করে দেওয়া হবে (কারণ সে তো আগে থেকেই লগইন করা)।
      return NextResponse.redirect(new URL('/', request.url));
    } catch (err) {
      // টোকেন ইনভ্যালিড হলে তাকে লগইন পেজেই থাকতে দিবে।
    }
  }

  // সবকিছু ঠিক থাকলে রিকোয়েস্টটিকে তার গন্তব্যে (পরবর্তী ধাপে) যেতে দেওয়া হয়।
  return NextResponse.next();
}

export const config = {
  // matcher নির্ধারণ করে দেয় কোন কোন পাথের জন্য এই মিডলওয়্যার কাজ করবে।
  // এখানে বলা হয়েছে স্ট্যাটিক ফাইল (ছবি, আইকন, ফন্ট) বাদে বাকি সবকিছুর জন্য এটি কাজ করবে।
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
