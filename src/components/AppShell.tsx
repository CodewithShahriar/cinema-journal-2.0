import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Film,
  Bookmark,
  CheckCircle2,
  Heart,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";
import { BottomNav } from "./BottomNav";
import { Button } from "./ui/button";

const navLinks = [
  { to: "/", label: "Home", icon: Film },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/watched", label: "Watched", icon: CheckCircle2 },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/stats", label: "Stats", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Background cinematic ambient spotlights */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_at_top,rgb(229_9_20/28%),transparent_65%)]" />
      <div className="pointer-events-none fixed -top-40 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgb(229_9_20/12%),transparent_70%)] blur-3xl" />

      {/* Top Header - Responsive for both Desktop and Mobile with Notch/Safe-Area Support */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/95 backdrop-blur-2xl pt-safe shadow-sm">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="group flex items-center gap-2 sm:gap-2.5 transition-transform hover:scale-[1.02]">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 ring-1 ring-white/20">
                <Film className="h-4 w-4 sm:h-5 sm:w-5 text-white transition-transform group-hover:rotate-12" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-base font-black tracking-tight text-white sm:text-xl">
                  CINE<span className="text-primary">JOURNAL</span>
                </span>
                <span className="hidden -mt-1 text-[9px] font-medium tracking-widest text-muted-foreground uppercase sm:block">
                  Cinema & Series Tracker
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium tracking-wide transition-all ${
                      active
                        ? "bg-primary/15 text-primary ring-1 ring-primary/30 font-semibold"
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Add Movie Button */}
            <Button
              asChild
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white font-medium text-xs rounded-xl shadow-lg shadow-primary/25 ring-1 ring-white/10 h-8 sm:h-9 px-2.5 sm:px-3"
            >
              <Link to="/add" className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Log Movie</span>
              </Link>
            </Button>

            {/* Settings Link - Easily accessible on Mobile & Desktop */}
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white shrink-0 active:scale-95 transition-transform"
            >
              <Link to="/settings" title="Settings & Sync" aria-label="Settings & Sync">
                <Settings className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Responsive Body Container */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 pb-28 md:pb-16">
        {children}
      </main>

      {/* Mobile Floating Bottom Bar (visible on md:hidden) */}
      <BottomNav />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  );
}
