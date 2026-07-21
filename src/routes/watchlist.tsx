import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark, Search, SlidersHorizontal } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { MovieCard, EmptyState } from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      <PageHeader title="Watchlist" subtitle={`${list.length} films waiting`} />

      <div className="mb-3 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, genre, note..."
          className="pl-9"
        />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger>
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genres</SelectItem>
            {GENRES.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger>
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest added</SelectItem>
            <SelectItem value="oldest">Oldest added</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => setFavOnly((v) => !v)}
          className={`rounded-md border px-3 text-sm transition-colors ${
            favOnly ? "border-primary bg-primary/10 text-primary" : "border-input bg-transparent"
          }`}
        >
          {favOnly ? "★ Favorites" : "☆ Favorites"}
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Your watchlist is empty"
          hint="Add movies you plan to watch — they'll appear here."
        />
      ) : (
        <div className="space-y-3">
          {list.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
