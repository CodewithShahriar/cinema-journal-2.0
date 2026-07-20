import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { MovieCard, EmptyState } from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/watched")({ component: WatchedPage });

function WatchedPage() {
  const { movies } = useMovies();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent");

  const list = useMemo(() => {
    let out = movies.filter((m) => m.status === "watched");
    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter(
        (m) => m.title.toLowerCase().includes(s) || m.genres.some((g) => g.toLowerCase().includes(s)) || (m.note ?? "").toLowerCase().includes(s),
      );
    }
    if (sort === "recent") out = [...out].sort((a, b) => (b.watchDate ?? "").localeCompare(a.watchDate ?? ""));
    if (sort === "rating") out = [...out].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "title") out = [...out].sort((a, b) => a.title.localeCompare(b.title));
    return out;
  }, [movies, q, sort]);

  return (
    <AppShell>
      <PageHeader title="Watched" subtitle={`${list.length} films in your journal`} />
      <div className="mb-3 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search watched..." className="pl-9" />
      </div>
      <div className="mb-5">
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently watched</SelectItem>
            <SelectItem value="rating">Highest rated</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing watched yet" hint="Mark a movie from your watchlist as watched." />
      ) : (
        <div className="space-y-3">{list.map((m) => <MovieCard key={m.id} movie={m} />)}</div>
      )}
    </AppShell>
  );
}
