import { createFileRoute, Link } from "@tanstack/react-router";
import { Film, Bookmark, CheckCircle2, Heart, Star, Plus, BarChart3, TrendingUp } from "lucide-react";
import { useMovies } from "@/lib/movies-store";
import { AppShell } from "@/components/AppShell";
import { MovieCard, EmptyState } from "@/components/MovieCard";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "CineJournal — Your personal movie tracker" },
      {
        name: "description",
        content:
          "A beautiful, private movie journal powered by TMDB. Track your watchlist, rate what you watched, and keep your cinema memories.",
      },
      { property: "og:title", content: "CineJournal — Your personal movie tracker" },
      { property: "og:description", content: "Track, rate, and remember every film you love." },
    ],
  }),
});

function Stat({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tint?: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-lg shadow-black/20">
      <div
        className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${
          tint ?? "bg-primary/15 text-primary"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Home() {
  const { movies, hydrated } = useMovies();
  const total = movies.length;
  const watched = movies.filter((m) => m.status === "watched");
  const watchlist = movies.filter((m) => m.status === "watchlist");
  const favorites = movies.filter((m) => m.favorite);
  const rated = watched.filter((m) => m.personalRating != null);
  const avg = rated.length
    ? rated.reduce((s, m) => s + (m.personalRating ?? 0), 0) / rated.length
    : 0;
  const pct = total ? Math.round((watched.length / total) * 100) : 0;
  const recent = [...watched]
    .sort((a, b) => (b.watchDate ?? "").localeCompare(a.watchDate ?? ""))
    .slice(0, 4);

  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md gradient-primary text-white">
              <Film className="h-3.5 w-3.5" />
            </span>
            CineJournal
          </div>
          {/* <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight">
            
          </h1> */}
          <p className="mt-1 text-sm text-muted-foreground">Track, rate & remember every film.</p>
        </div>
        <Link
          to="/add"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-primary text-white shadow-lg shadow-primary/40 transition-transform hover:scale-105"
          aria-label="Add movie"
        >
          <Plus className="h-5 w-5" />
        </Link>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Stat icon={Film} label="Total movies" value={total} />
        <Stat
          icon={Bookmark}
          label="Watchlist"
          value={watchlist.length}
          tint="bg-blue-500/15 text-blue-400"
        />
        <Stat
          icon={CheckCircle2}
          label="Watched"
          value={watched.length}
          tint="bg-emerald-500/15 text-emerald-400"
        />
        <Stat
          icon={Heart}
          label="Favorites"
          value={favorites.length}
          tint="bg-pink-500/15 text-pink-400"
        />
      </div>

      <div className="mb-6 rounded-2xl bg-card p-5 ring-1 ring-border shadow-lg shadow-black/20">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Watch completion</span>
          </div>
          <span className="text-sm text-muted-foreground">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-current text-gold" />
            <span className="text-sm font-semibold">Average rating</span>
          </div>
          <span className="text-lg font-bold text-gold">{avg.toFixed(1)}</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link
          to="/add"
          className="rounded-2xl gradient-primary p-4 text-white shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5"
        >
          <Plus className="mb-2 h-5 w-5" />
          <div className="text-sm font-semibold">Add Movie</div>
          <div className="text-xs opacity-80">Search TMDB</div>
        </Link>
        <Link
          to="/stats"
          className="rounded-2xl bg-card p-4 ring-1 ring-border transition-transform hover:-translate-y-0.5"
        >
          <BarChart3 className="mb-2 h-5 w-5 text-gold" />
          <div className="text-sm font-semibold">Statistics</div>
          <div className="text-xs text-muted-foreground">View insights</div>
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recently watched</h2>
          <Link to="/watched" className="text-xs text-primary">
            View all
          </Link>
        </div>
        {!hydrated ? null : recent.length === 0 ? (
          <EmptyState
            icon={Film}
            title="No watched movies yet"
            hint="Add a movie and mark it as watched to build your journal."
          />
        ) : (
          <div className="space-y-3">
            {recent.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
