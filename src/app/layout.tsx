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
  title: "AKASHI | Mission Control for Crypto Intelligence",
  description:
    "Real-time market probabilities decoded through ElizaOS. Evidence, not speculation.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
          <div className="border-b border-[#1a1f2e] bg-[#0a0a0f]/80 backdrop-blur-sm">
            <div className="mx-auto w-full max-w-6xl px-6 py-3">
              <div className="flex items-center justify-center gap-6 text-xs text-[#6b7280] uppercase tracking-wider">
                <span>CA: coming soon</span>
                <span className="text-[#1a1f2e]">•</span>
                <a href="mailto:info@akashitech.xyz" className="text-[#00d9ff] hover:text-[#00b8d9] transition-colors">
                  email: info@akashitech.xyz
                </a>
              </div>
            </div>
          </div>
          <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12">
            {children}
          </main>
          <footer className="border-t border-[#1a1f2e] bg-[#0a0a0f]/80 backdrop-blur-sm px-6 py-10 text-xs text-[#6b7280] relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d9ff]/30 to-transparent"></div>
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
              <p className="font-black tracking-wider text-[#00d9ff] uppercase">AKASHI</p>
              <p className="max-w-md text-[#6b7280]">
                Informational analysis based on prediction market data. Not financial advice or investment recommendations.
              </p>
              <Link href="/trust" className="text-[#00d9ff] hover:text-[#00b8d9] transition-colors uppercase tracking-wider font-semibold">
                METHOD →
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
