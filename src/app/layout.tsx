import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], display: "swap", variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "NodeCommerce — Premium B2C Shopping",
  description: "Discover thousands of premium products at unbeatable prices. Shop fashion, electronics, lifestyle, and more.",
  keywords: "ecommerce, shopping, fashion, electronics, Bangladesh, online store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>{children}</body>
    </html>
  );
}
