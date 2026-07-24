import { useState } from "react";
import { Search, Star, Calendar, Loader2, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PosterFallback } from "@/components/MovieCard";
import { useTmdbSearch } from "@/lib/tmdb";
import { useMovies } from "@/lib/movies-store";
import type { TmdbSearchResult } from "@/lib/tmdb-types";
import { useNavigate } from "@tanstack/react-router";

// TMDB genre id -> name (kept locally so search results can show genres w/o an
// extra API call). Source: /genre/movie/list, refreshed rarely.
const TMDB_GENRES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
};

export function TmdbSearchPicker({ compact = false }: { compact?: boolean }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<TmdbSearchResult | null>(null);
  const [status, setStatus] = useState<"watchlist" | "watched">("watchlist");
  const [favorite, setFavorite] = useState(false);
  const [personalRating, setPersonalRating] = useState(7);
  const [notes, setNotes] = useState("");
  const [review, setReview] = useState("");

  const { data: results, isFetching, error } = useTmdbSearch(q);
  const { addByTmdb, hasTmdb } = useMovies();
  const navigate = useNavigate();

  const handleAdd = () => {
    if (!selected) return;
    if (hasTmdb(selected.id)) {
      toast.error(`"${selected.title}" is already in your journal`);
      return;
    }
    const { movie, duplicate } = addByTmdb({
      tmdbId: selected.id,
      status,
      favorite,
      personalRating: status === "watched" ? personalRating : undefined,
      review: review.trim() || undefined,
      notes: notes.trim() || undefined,
      cached: {
        id: selected.id,
        title: selected.title,
        year: selected.year,
        poster: selected.poster,
        overview: selected.overview,
        voteAverage: selected.voteAverage,
        genres: selected.genreIds.map((id) => TMDB_GENRES[id]).filter(Boolean),
      },
    });
    if (duplicate) {
      toast.error("Already in your journal");
      return;
    }
    toast.success(`"${selected.title}" added`);
    navigate({ to: status === "watched" ? "/watched" : "/watchlist", params: {} });
    void movie;
  };

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSelected(null);
          }}
          placeholder="Search TMDB for a movie…"
          className="pl-9"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
          Couldn't reach TMDB. Check your connection and try again.
        </p>
      )}

      {q.trim().length >= 2 && !isFetching && results && results.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No movies found for "{q}".
        </p>
      )}

      {!compact && q.trim().length < 2 && (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Type at least 2 characters to search TMDB.
        </p>
      )}

      <ul className="space-y-2">
        {(results ?? []).map((r) => {
          const already = hasTmdb(r.id);
          const isSelected = selected?.id === r.id;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => !already && setSelected(isSelected ? null : r)}
                disabled={already}
                className={`flex w-full gap-3 rounded-2xl p-3 text-left ring-1 transition-all ${
                  isSelected
                    ? "bg-primary/10 ring-primary"
                    : "bg-card ring-border hover:ring-primary/40"
                } ${already ? "opacity-60" : ""}`}
              >
                <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {r.poster ? (
                    <img src={r.poster} alt={r.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <PosterFallback title={r.title} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{r.title}</h3>
                    {already && (
                      <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400">
                        Added
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    {r.year && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {r.year}
                      </span>
                    )}
                    {r.voteAverage != null && r.voteAverage > 0 && (
                      <span className="inline-flex items-center gap-1 text-gold">
                        <Star className="h-3 w-3 fill-current" />
                        {r.voteAverage.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.genreIds
                      .slice(0, 3)
                      .map((id) => TMDB_GENRES[id])
                      .filter(Boolean)
                      .map((g) => (
                        <span
                          key={g}
                          className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground"
                        >
                          {g}
                        </span>
                      ))}
                  </div>
                  {r.overview && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{r.overview}</p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <div className="sticky bottom-24 space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xl shadow-black/40 animate-fade-in">
          <div>
            <Label>Status</Label>
            <RadioGroup
              value={status}
              onValueChange={(v) => setStatus(v as "watchlist" | "watched")}
              className="mt-2 grid grid-cols-2 gap-2"
            >
              {(["watchlist", "watched"] as const).map((s) => (
                <label
                  key={s}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-all ${
                    status === s ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}
                >
                  <RadioGroupItem value={s} className="sr-only" />
                  {s}
                </label>
              ))}
            </RadioGroup>
          </div>

          {status === "watched" && (
            <div className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-gold" />
                  Your rating
                </Label>
                <span className="text-lg font-semibold text-gold">
                  {personalRating.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[personalRating]}
                min={0}
                max={10}
                step={0.5}
                onValueChange={(v) => setPersonalRating(v[0])}
              />
            </div>
          )}

          <div>
            <Label>Review</Label>
            <Textarea
              rows={2}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What did you think?"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Private notes</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Things to remember…"
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <Label className="text-sm">Mark as favorite</Label>
            <Switch checked={favorite} onCheckedChange={setFavorite} />
          </div>

          <Button
            type="button"
            onClick={handleAdd}
            className="w-full rounded-xl py-6 text-base font-semibold gradient-primary text-primary-foreground"
          >
            {status === "watched" ? (
              <CheckCircle2 className="mr-2 h-5 w-5" />
            ) : (
              <Plus className="mr-2 h-5 w-5" />
            )}
            Add "{selected.title}"
          </Button>
        </div>
      )}
    </div>
  );
}
