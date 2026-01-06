import Link from "next/link";

const navItems = [
  { href: "/", label: "HOME" },
  { href: "/markets", label: "MARKETS" },
  { href: "/trust", label: "METHOD" },
];

export default function TopNav() {
  return (
    <header className="border-b border-[#1a1f2e] bg-[#0a0a0f]/90 backdrop-blur-md relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d9ff]/50 to-transparent"></div>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-baseline gap-2 transition-all hover:opacity-90">
          <span className="text-2xl font-black tracking-wider text-[#00d9ff] glow-text">AKASHI</span>
          <span className="text-xs text-[#6b7280] font-light ml-1">証</span>
        </Link>
        <nav className="flex items-center gap-1 text-xs font-semibold tracking-wider uppercase">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-[#6b7280] transition-all hover:text-[#00d9ff] hover:bg-[#1a1f2e]/50 relative group"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00d9ff] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

