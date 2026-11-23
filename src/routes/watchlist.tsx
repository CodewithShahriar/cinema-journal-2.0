import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark, Search, SlidersHorizontal, LayoutGrid, List, Heart } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { MovieCard, EmptyState } from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-store";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GENRES } from "@/lib/movie-types";

export const Route = createFileRoute("/watchlist")({
  component: WatchlistPage,
  head: () => ({
    meta: [
      { title: "Watchlist · CineJournal" },
      { name: "description", content: "Films you're planning to watch." },
      { property: "og:title", content: "Watchlist · CineJournal" },
      { property: "og:description", content: "Films you're planning to watch." },
    ],
  }),
});

function WatchlistPage() {
  const { movies } = useMovies();
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [favOnly, setFavOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "row">("grid");

  const years = useMemo(
    () =>
      Array.from(
        new Set(movies.map((m) => m.cached?.year).filter((y): y is number => !!y)),
      ).sort((a, b) => b - a),
    [movies],
  );

  const list = useMemo(() => {
    let out = movies.filter((m) => m.status === "watchlist");
    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter(
        (m) =>
          (m.cached?.title ?? "").toLowerCase().includes(s) ||
          (m.cached?.genres ?? []).some((g) => g.toLowerCase().includes(s)) ||
          (m.notes ?? "").toLowerCase().includes(s) ||
          (m.review ?? "").toLowerCase().includes(s) ||
          String(m.cached?.year ?? "").includes(s),
      );
    }
    if (genre !== "all") out = out.filter((m) => (m.cached?.genres ?? []).includes(genre));
    if (year !== "all") out = out.filter((m) => String(m.cached?.year) === year);
    if (favOnly) out = out.filter((m) => m.favorite);
    if (sort === "newest") out = [...out].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "oldest") out = [...out].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (sort === "title")
      out = [...out].sort((a, b) => (a.cached?.title ?? "").localeCompare(b.cached?.title ?? ""));
    if (sort === "year")
      out = [...out].sort((a, b) => (b.cached?.year ?? 0) - (a.cached?.year ?? 0));
    return out;
  }, [movies, q, genre, year, favOnly, sort]);

  return (
    <AppShell>
      <PageHeader
        title="Watchlist"
        subtitle={`${list.length} films queued for upcoming screenings`}
        right={
          <div className="flex items-center gap-1 rounded-xl bg-card p-1 border border-white/10">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-lg ${
                viewMode === "grid"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-lg ${
                viewMode === "row"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
              onClick={() => setViewMode("row")}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="glass-card mb-6 flex flex-col gap-3 rounded-2xl p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, genre, note..."
            className="pl-9 bg-background/50 border-white/10 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="bg-background/50 border-white/10 rounded-xl text-xs">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all">All genres</SelectItem>
              {GENRES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="bg-background/50 border-white/10 rounded-xl text-xs">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all">All years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="bg-background/50 border-white/10 rounded-xl text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="newest">Newest added</SelectItem>
              <SelectItem value="oldest">Oldest added</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={() => setFavOnly((v) => !v)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all ${
              favOnly
                ? "border-primary bg-primary/20 text-primary font-semibold"
                : "border-white/10 bg-background/50 text-muted-foreground hover:text-white"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${favOnly ? "fill-primary" : ""}`} />
            Favorites Only
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No watchlist movies match"
          hint="Try adjusting your filters or search for new movies to add."
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4">
          {list.map((m) => (
            <MovieCard key={m.id} movie={m} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((m) => (
            <MovieCard key={m.id} movie={m} variant="row" />
          ))}
        </div>
      )}
    </AppShell>
  );
}
