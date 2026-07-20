import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Star, Film, Clock } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useMovies } from "@/lib/movies-store";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/stats")({ component: StatsPage });

function StatsPage() {
  const { movies } = useMovies();
  const watched = movies.filter((m) => m.status === "watched");
  const total = movies.length;
  const pct = total ? (watched.length / total) * 100 : 0;
  const totalTime = watched.reduce((s, m) => s + (m.runtime ?? 0), 0);
  const hours = Math.floor(totalTime / 60);

  const byGenre = useMemo(() => {
    const map = new Map<string, number>();
    watched.forEach((m) => m.genres.forEach((g) => map.set(g, (map.get(g) ?? 0) + 1)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [watched]);

  const byYear = useMemo(() => {
    const map = new Map<number, number>();
    watched.forEach((m) => m.year && map.set(m.year, (map.get(m.year) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[0] - a[0]).slice(0, 8);
  }, [watched]);

  const ratingDist = useMemo(() => {
    const bins = [0, 0, 0, 0, 0]; // 0-2,2-4,4-6,6-8,8-10
    watched.forEach((m) => {
      if (m.rating == null) return;
      const idx = Math.min(4, Math.floor(m.rating / 2));
      bins[idx]++;
    });
    return bins;
  }, [watched]);
  const maxRating = Math.max(1, ...ratingDist);

  const topRated = [...watched].filter((m) => m.rating != null).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5);
  const maxGenre = Math.max(1, ...byGenre.map(([, n]) => n));
  const maxYear = Math.max(1, ...byYear.map(([, n]) => n));

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-border">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-semibold">Statistics</h1>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <Film className="mb-1 h-4 w-4 text-primary" />
          <div className="text-xl font-bold">{total}</div>
          <div className="text-[10px] text-muted-foreground">Total</div>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="mb-1 text-[10px] font-bold text-emerald-400">%</div>
          <div className="text-xl font-bold">{Math.round(pct)}%</div>
          <div className="text-[10px] text-muted-foreground">Watched</div>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <Clock className="mb-1 h-4 w-4 text-gold" />
          <div className="text-xl font-bold">{hours}h</div>
          <div className="text-[10px] text-muted-foreground">Watch time</div>
        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="mb-3 text-sm font-semibold">Collection progress</h3>
        <Progress value={pct} />
        <p className="mt-2 text-xs text-muted-foreground">{watched.length} of {total} completed</p>
      </div>

      <div className="mb-4 rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Star className="h-4 w-4 text-gold" />Top rated</h3>
        {topRated.length === 0 ? (
          <p className="text-xs text-muted-foreground">No ratings yet.</p>
        ) : (
          <ul className="space-y-2">
            {topRated.map((m, i) => (
              <li key={m.id} className="flex items-center gap-3">
                <span className="w-4 text-xs font-bold text-muted-foreground">#{i + 1}</span>
                <Link to="/movie/$id" params={{ id: m.id }} className="flex-1 truncate text-sm hover:text-primary">{m.title}</Link>
                <span className="text-sm font-semibold text-gold">{m.rating?.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4 rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="mb-4 text-sm font-semibold">By genre</h3>
        {byGenre.length === 0 ? <p className="text-xs text-muted-foreground">No data.</p> : (
          <div className="space-y-2">
            {byGenre.slice(0, 8).map(([g, n]) => (
              <div key={g}>
                <div className="mb-1 flex justify-between text-xs"><span>{g}</span><span className="text-muted-foreground">{n}</span></div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full gradient-primary" style={{ width: `${(n / maxGenre) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="mb-4 text-sm font-semibold">By release year</h3>
        {byYear.length === 0 ? <p className="text-xs text-muted-foreground">No data.</p> : (
          <div className="flex items-end justify-between gap-2 h-32">
            {byYear.slice().reverse().map(([y, n]) => (
              <div key={y} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t-md gradient-primary" style={{ height: `${(n / maxYear) * 100}%` }} />
                <span className="text-[10px] text-muted-foreground">{y}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h3 className="mb-4 text-sm font-semibold">Rating distribution</h3>
        <div className="flex items-end justify-between gap-2 h-24">
          {ratingDist.map((n, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-gold/70" style={{ height: `${(n / maxRating) * 100}%` }} />
              <span className="text-[10px] text-muted-foreground">{i * 2}-{i * 2 + 2}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
