import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AKASHI | Evidence-based market insights",
  description:
    "Market probabilities translated into clear, evidence-based insights. No speculation, just signal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <div className="min-h-screen">
          <TopNav />
          <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12">
            {children}
          </main>
          <footer className="border-t border-[#e5e5e5] bg-white px-6 py-10 text-sm text-[#8e8e8e]">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-[#0f0f0f] tracking-wide">AKASHI</p>
              <p className="max-w-md">
                Informational analysis based on prediction market data. Not financial advice or investment recommendations.
              </p>
              <Link href="/trust" className="text-[#c92a2a] hover:text-[#a61e1e] transition-colors">
                Method
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
