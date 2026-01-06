import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Markets" },
  { href: "/trust", label: "Method" },
];

export default function TopNav() {
  return (
    <header className="border-b border-[#e5e5e5] bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="group flex items-baseline gap-2 transition-opacity hover:opacity-80">
          <span className="text-xl font-bold tracking-tight text-[#0f0f0f]">AKASHI</span>
          <span className="text-sm text-[#8e8e8e] font-normal">証</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-[#4a4a4a] transition-colors hover:text-[#0f0f0f] hover:bg-[#f5f4ef]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

