import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Dashboard" },
  { href: "/trust", label: "Trust & method" },
];

export default function TopNav() {
  return (
    <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-white">
          Credence
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-slate-200 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

