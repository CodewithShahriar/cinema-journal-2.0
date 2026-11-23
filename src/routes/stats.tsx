import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Star, Film, Clock, BarChart3, TrendingUp, Trophy, Calendar, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useMovies } from "@/lib/movies-store";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CineWrappedModal } from "@/components/CineWrappedModal";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
  head: () => ({
    meta: [
      { title: "Cinema Analytics & Statistics · CineJournal" },
      { name: "description", content: "Insights into your cinematic life and movie screening habits." },
      { property: "og:title", content: "Cinema Analytics · CineJournal" },
      { property: "og:description", content: "Insights into your cinematic life." },
    ],
  }),
});

function StatsPage() {
  const { movies } = useMovies();
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const watched = movies.filter((m) => m.status === "watched");
  const total = movies.length;
  const pct = total ? Math.round((watched.length / total) * 100) : 0;
  const totalTime = watched.reduce((s, m) => s + (m.cached?.runtime ?? 0), 0);
  const hours = Math.floor(totalTime / 60);
  const mins = totalTime % 60;

  const rated = watched.filter((m) => m.personalRating != null);
  const avg = rated.length
    ? rated.reduce((s, m) => s + (m.personalRating ?? 0), 0) / rated.length
    : 0;

  const totalRewatches = watched.reduce((s, m) => s + (m.rewatchCount ?? 0), 0);

  const byGenre = useMemo(() => {
    const map = new Map<string, number>();
    watched.forEach((m) =>
      (m.cached?.genres ?? []).forEach((g) => map.set(g, (map.get(g) ?? 0) + 1)),
    );
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [watched]);

  const byYear = useMemo(() => {
    const map = new Map<number, number>();
    watched.forEach((m) => {
      const y = m.cached?.year;
      if (y) map.set(y, (map.get(y) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[0] - a[0]).slice(0, 8);
  }, [watched]);

  const ratingDist = useMemo(() => {
    const bins = [0, 0, 0, 0, 0]; // 0-2, 2-4, 4-6, 6-8, 8-10
    watched.forEach((m) => {
      if (m.personalRating == null) return;
      const idx = Math.min(4, Math.floor(m.personalRating / 2));
      bins[idx]++;
    });
    return bins;
  }, [watched]);
  const maxRating = Math.max(1, ...ratingDist);

  const topRated = [...watched]
    .filter((m) => m.personalRating != null)
    .sort((a, b) => (b.personalRating ?? 0) - (a.personalRating ?? 0))
    .slice(0, 5);
  const maxGenre = Math.max(1, ...byGenre.map(([, n]) => n));
  const maxYear = Math.max(1, ...byYear.map(([, n]) => n));

  return (
    <AppShell>
      <PageHeader
        title="Cinema Analytics"
        subtitle="Detailed insights into your viewing habits and collection"
      />

      {/* CineWrapped Annual Story Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border border-red-500/25 bg-gradient-to-r from-red-950/40 via-zinc-900/60 to-black backdrop-blur-md shadow-xl transition-all hover:border-red-500/40">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-inner">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Your CineWrapped Story
              </h3>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-black text-primary border border-primary/30 uppercase">
                Annual Recap
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              Spotify Wrapped style interactive journey of your movie milestones and persona.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setWrappedOpen(true)}
          className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shrink-0 shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Launch CineWrapped ✨
        </Button>
      </div>

      {/* Top 4 KPI Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="glass-card rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Total Movies</span>
            <Film className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-white">{total}</div>
          <span className="text-[11px] text-muted-foreground">{watched.length} watched</span>
        </div>

        <div className="glass-card rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Total Screen Time</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{hours}h {mins}m</div>
          <span className="text-[11px] text-muted-foreground">{totalTime} total minutes</span>
        </div>

        <div className="glass-card rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Average Rating</span>
            <Star className="h-4 w-4 text-amber-400 fill-current" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {avg ? `${avg.toFixed(1)} ★` : "—"}
          </div>
          <span className="text-[11px] text-muted-foreground">{rated.length} movies rated</span>
        </div>

        <div className="glass-card rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Logged Rewatches</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{totalRewatches}×</div>
          <span className="text-[11px] text-muted-foreground">repeat screenings</span>
        </div>
      </div>

      {/* Collection Completion Progress Card */}
      <div className="glass-card mb-6 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">Watchlist Completion</h3>
          <span className="text-sm font-bold text-primary">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2.5 bg-zinc-800" />
        <p className="mt-2 text-xs text-muted-foreground">
          {watched.length} of {total} films watched from your journal
        </p>
      </div>

      {/* Grid Dashboard for Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Rated Masterpieces */}
        <div className="glass-card rounded-2xl p-5 shadow-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Trophy className="h-4 w-4 text-amber-400" />
            Top Rated Films
          </h3>
          {topRated.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No personal ratings given yet.</p>
          ) : (
            <ul className="space-y-3">
              {topRated.map((m, i) => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 border border-white/5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-xs font-bold text-amber-400">
                    #{i + 1}
                  </span>
                  <Link
                    to="/movie/$id"
                    params={{ id: m.id }}
                    className="flex-1 truncate text-sm font-medium text-white hover:text-primary transition-colors"
                  >
                    {m.cached?.title ?? "Movie"}
                  </Link>
                  <span className="flex items-center gap-1 text-sm font-bold text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {m.personalRating?.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rating Distribution Histogram */}
        <div className="glass-card rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <BarChart3 className="h-4 w-4 text-primary" />
            Rating Distribution
          </h3>
          <div className="flex items-end justify-between gap-3 h-40 pt-4">
            {ratingDist.map((count, i) => {
              const label = `${i * 2}-${i * 2 + 2}★`;
              const heightPct = (count / maxRating) * 100;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[11px] font-bold text-amber-400">{count > 0 ? count : ""}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary/60 to-primary transition-all duration-500"
                    style={{ height: `${Math.max(6, heightPct)}%` }}
                  />
                  <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Genres Breakdown */}
        <div className="glass-card rounded-2xl p-5 shadow-xl">
          <h3 className="mb-4 text-sm font-semibold text-white">Top Watched Genres</h3>
          {byGenre.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No genre data available.</p>
          ) : (
            <div className="space-y-3">
              {byGenre.slice(0, 7).map(([g, count]) => (
                <div key={g}>
                  <div className="mb-1 flex justify-between text-xs font-medium">
                    <span className="text-zinc-200">{g}</span>
                    <span className="text-primary font-bold">{count} films</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxGenre) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Release Years Breakdown */}
        <div className="glass-card rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Calendar className="h-4 w-4 text-primary" />
            Release Era Breakdown
          </h3>
          {byYear.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No year data recorded.</p>
          ) : (
            <div className="flex items-end justify-between gap-2 h-40 pt-4">
              {byYear
                .slice()
                .reverse()
                .map(([y, count]) => {
                  const heightPct = (count / maxYear) * 100;
                  return (
                    <div key={y} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-bold text-white">{count}</span>
                      <div
                        className="w-full rounded-t-lg bg-zinc-700 hover:bg-primary transition-all duration-300"
                        style={{ height: `${Math.max(8, heightPct)}%` }}
                        title={`${y}: ${count} movies`}
                      />
                      <span className="text-[10px] text-muted-foreground">{y}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <CineWrappedModal
        isOpen={wrappedOpen}
        onOpenChange={setWrappedOpen}
      />
    </AppShell>
  );
}
