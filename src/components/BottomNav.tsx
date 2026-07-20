import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Bookmark, CheckCircle2, Heart, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/watched", label: "Watched", icon: CheckCircle2 },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-2xl px-3 pb-3">
        <div className="glass flex items-center justify-between rounded-2xl px-2 py-1.5 shadow-2xl">
          {items.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-all ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} strokeWidth={active ? 2.4 : 1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
