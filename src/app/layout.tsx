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
  title: "Credence | Market-interpreted crypto insights",
  description:
    "Crypto events explained through prediction market probabilities. No advice, just transparent, probabilistic context.",
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
          <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
            {children}
          </main>
          <footer className="border-t border-white/10 bg-slate-900/60 px-6 py-8 text-sm text-slate-300">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium text-slate-100">Credence</p>
              <p>
                This platform provides informational analysis based on prediction
                market data. It does not provide financial advice or investment
                recommendations.
              </p>
              <Link href="/trust" className="text-sky-300 hover:text-sky-200">
                Learn how we handle uncertainty
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
