import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Search, LayoutGrid, List } from "lucide-react";
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

export const Route = createFileRoute("/watched")({
  component: WatchedPage,
  head: () => ({
    meta: [
      { title: "Watched Films · CineJournal" },
      { name: "description", content: "Every film you've watched, rated and reviewed." },
      { property: "og:title", content: "Watched Films · CineJournal" },
      { property: "og:description", content: "Every film you've watched." },
    ],
  }),
});

function WatchedPage() {
  const { movies } = useMovies();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent");
  const [viewMode, setViewMode] = useState<"grid" | "row">("grid");

  const list = useMemo(() => {
    let out = movies.filter((m) => m.status === "watched");
    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter(
        (m) =>
          (m.cached?.title ?? "").toLowerCase().includes(s) ||
          (m.cached?.genres ?? []).some((g) => g.toLowerCase().includes(s)) ||
          (m.notes ?? "").toLowerCase().includes(s) ||
          (m.review ?? "").toLowerCase().includes(s),
      );
    }
    if (sort === "recent")
      out = [...out].sort((a, b) => (b.watchDate ?? "").localeCompare(a.watchDate ?? ""));
    if (sort === "rating")
      out = [...out].sort((a, b) => (b.personalRating ?? 0) - (a.personalRating ?? 0));
    if (sort === "title")
      out = [...out].sort((a, b) => (a.cached?.title ?? "").localeCompare(b.cached?.title ?? ""));
    return out;
  }, [movies, q, sort]);

  return (
    <AppShell>
      <PageHeader
        title="Watched Films"
        subtitle={`${list.length} films recorded in your cinema journal`}
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

      {/* Search & Filter Toolbar */}
      <div className="glass-card mb-6 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, genre, notes..."
            className="pl-9 bg-background/50 border-white/10 rounded-xl"
          />
        </div>

        <div className="w-full sm:w-48 shrink-0">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="bg-background/50 border-white/10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="recent">Recently watched</SelectItem>
              <SelectItem value="rating">Highest rated</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No watched movies found"
          hint="Mark films as watched from your watchlist or search to build your journal."
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
