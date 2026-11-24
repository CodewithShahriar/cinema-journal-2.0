import { Link, useRouterState } from "@tanstack/react-router";
import { Film, Bookmark, CheckCircle2, BarChart3, Plus } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Film },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/add", label: "Add", icon: Plus, isAction: true },
  { to: "/watched", label: "Watched", icon: CheckCircle2 },
  { to: "/stats", label: "Stats", icon: BarChart3 },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden pointer-events-none">
      {/* Frosted gradient blur backdrop ensuring nothing awkwardly peeks underneath */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-md pointer-events-none" />

      <div className="relative mx-auto max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 pointer-events-auto">
        <div className="glass flex items-center justify-between rounded-2xl p-1.5 shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl bg-zinc-950/85">
          {items.map((item) => {
            const { to, label, icon: Icon } = item;
            const isAction = "isAction" in item && item.isAction;
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);

            if (isAction) {
              return (
                <Link
                  key={to}
                  to={to}
                  aria-label="Add Movie"
                  className="relative -top-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/40 ring-2 ring-background transition-transform active:scale-95"
                >
                  <Plus className="h-6 w-6 stroke-[2.5]" />
                </Link>
              );
            }

            return (
              <Link
                key={to}
                to={to}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-all active:scale-95 ${
                  active ? "text-primary font-semibold" : "text-muted-foreground hover:text-white"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    active ? "scale-110 stroke-[2.4]" : "stroke-[1.75]"
                  }`}
                />
                <span>{label}</span>
                {active && (
                  <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary ring-2 ring-primary/30" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
