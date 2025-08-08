import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logoUrl from "@/assets/hero-alphasup.jpg";

const navItems = [
  { to: "/", label: "Ana Sayfa" },
  { to: "/hizmetler", label: "Hizmetler" },
  { to: "/rezervasyon", label: "Rezervasyon" },
  { to: "/sss", label: "SSS" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md overflow-hidden">
            <img src={logoUrl} alt="AlphaSUP logo" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <span className="font-semibold tracking-tight">AlphaSUP</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            Yönetici
          </NavLink>
          <Button asChild variant="hero" size="sm">
            <Link to="/rezervasyon">Hemen Rezervasyon</Link>
          </Button>
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Menü" onClick={() => setOpen((o) => !o)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </Button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-3 flex flex-col gap-3">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className="text-sm">
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/admin" onClick={() => setOpen(false)} className="text-sm">
              Yönetici
            </NavLink>
            <Button asChild variant="hero">
              <Link to="/rezervasyon">Hemen Rezervasyon</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
