import { useState } from "react";
import {
  Search,
  Star,
  Calendar,
  Loader2,
  CheckCircle2,
  Plus,
  Bookmark,
  Heart,
  Sliders,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { PosterFallback } from "@/components/MovieCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTmdbSearch } from "@/lib/tmdb";
import { useMovies } from "@/lib/movies-store";
import type { TmdbSearchResult } from "@/lib/tmdb-types";

// TMDB genre id -> name
const TMDB_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export function TmdbSearchPicker({ compact = false }: { compact?: boolean }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<TmdbSearchResult | null>(null);
  const [status, setStatus] = useState<"watchlist" | "watched">("watched");
  const [favorite, setFavorite] = useState(false);
  const [personalRating, setPersonalRating] = useState(8);
  const [notes, setNotes] = useState("");
  const [review, setReview] = useState("");

  const { data: results, isFetching, error } = useTmdbSearch(q);
  const { addByTmdb, hasTmdb } = useMovies();

  // Instant 1-click Watchlist Add (no scrolling or form needed)
  const handleQuickWatchlist = (e: React.MouseEvent, movie: TmdbSearchResult) => {
    e.stopPropagation();
    if (hasTmdb(movie.id)) {
      toast.info(`"${movie.title}" is already in your journal`);
      return;
    }

    addByTmdb({
      tmdbId: movie.id,
      status: "watchlist",
      cached: {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        poster: movie.poster,
        overview: movie.overview,
        voteAverage: movie.voteAverage,
        genres: movie.genreIds.map((id) => TMDB_GENRES[id]).filter(Boolean),
      },
    });

    toast.success(`"${movie.title}" added to your Watchlist!`);
  };

  // Open Log & Review Dialog for the clicked movie
  const openLogDialog = (movie: TmdbSearchResult, defaultStatus: "watchlist" | "watched" = "watched") => {
    setSelected(movie);
    setStatus(defaultStatus);
    setPersonalRating(8);
    setReview("");
    setNotes("");
    setFavorite(false);
  };

  // Submit movie from Dialog
  const handleDialogSubmit = () => {
    if (!selected) return;
    if (hasTmdb(selected.id)) {
      toast.error(`"${selected.title}" is already in your journal`);
      setSelected(null);
      return;
    }

    const { duplicate } = addByTmdb({
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

    toast.success(`"${selected.title}" logged successfully!`);
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus={!compact}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search movie title (e.g. Troy, Inception, Interstellar)…"
          className="pl-11 h-12 bg-card/90 border border-white/10 rounded-2xl text-sm focus:border-primary/70 focus:ring-1 focus:ring-primary/70 shadow-lg backdrop-blur-xl transition-all placeholder:text-muted-foreground/60"
        />
        {isFetching ? (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
        ) : q.trim() ? (
          <button
            onClick={() => setQ("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {error && (
        <p className="rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2">
          Couldn't reach TMDB. Check your connection and try again.
        </p>
      )}

      {q.trim().length >= 2 && !isFetching && results && results.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No movies found matching "{q}". Try checking the spelling.
        </p>
      )}

      {!compact && q.trim().length < 2 && (
        <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-muted-foreground">
          Type at least 2 characters to search millions of films from TMDB.
        </p>
      )}

      {/* Results List */}
      <ul className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
        {(results ?? []).map((r) => {
          const alreadyAdded = hasTmdb(r.id);

          return (
            <li key={r.id}>
              <div
                onClick={() => !alreadyAdded && openLogDialog(r, "watched")}
                className={`group flex items-center justify-between gap-3 rounded-2xl glass-card p-3 text-left border transition-all ${
                  alreadyAdded
                    ? "border-white/5 opacity-65 cursor-default"
                    : "border-white/10 hover:border-primary/50 cursor-pointer"
                }`}
              >
                {/* Movie Poster & Metadata */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-900 shadow-md">
                    {r.poster ? (
                      <img
                        src={r.poster}
                        alt={r.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <PosterFallback title={r.title} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="line-clamp-1 text-sm sm:text-base font-bold text-white group-hover:text-primary transition-colors">
                        {r.title}
                      </h3>
                      {alreadyAdded && (
                        <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          In Journal
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                      {r.year && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {r.year}
                        </span>
                      )}
                      {r.voteAverage != null && r.voteAverage > 0 && (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="h-3 w-3 fill-current" />
                          {r.voteAverage.toFixed(1)}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                        {r.genreIds
                          .slice(0, 2)
                          .map((id) => TMDB_GENRES[id])
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>

                    {r.overview && (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/80">
                        {r.overview}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side Quick Action Buttons (Immediate Add / Log) */}
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  {!alreadyAdded ? (
                    <>
                      {/* Fast 1-Click Watchlist Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleQuickWatchlist(e, r)}
                        title="Quick add to Watchlist"
                        className="h-8 px-2.5 rounded-xl border-white/10 bg-white/5 hover:bg-sky-500/20 hover:text-sky-300 hover:border-sky-500/30 text-xs text-muted-foreground transition-all"
                      >
                        <Bookmark className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Watchlist</span>
                      </Button>

                      {/* Log / Rate Dialog Button */}
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLogDialog(r, "watched");
                        }}
                        className="h-8 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-xs shadow-md shadow-primary/20"
                      >
                        <Plus className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Log / Rate</span>
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Modern Centered Log Movie Dialog (No scrolling required!) */}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md border-white/10 bg-card/95 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl">
          {selected && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-3.5 pb-2 border-b border-white/10">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-900 shadow">
                    {selected.poster ? (
                      <img src={selected.poster} alt={selected.title} className="h-full w-full object-cover" />
                    ) : (
                      <PosterFallback title={selected.title} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="font-display text-lg font-bold text-white line-clamp-1">
                      {selected.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      {selected.year && <span>{selected.year}</span>}
                      {selected.voteAverage != null && selected.voteAverage > 0 && (
                        <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-current" />
                          {selected.voteAverage.toFixed(1)}
                        </span>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Status Segmented Picker */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Add to Collection As:
                </Label>
                <div className="mt-2 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-background/80 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setStatus("watchlist")}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all ${
                      status === "watchlist"
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    Watchlist (Want to Watch)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("watched")}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all ${
                      status === "watched"
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Watched (I've Seen It)
                  </button>
                </div>
              </div>

              {/* Rating Section (Visible when Watched) */}
              {status === "watched" && (
                <div className="rounded-2xl border border-white/10 bg-background/50 p-4 animate-reveal-card">
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                      <Star className="h-4 w-4 text-amber-400 fill-current" />
                      Your Rating:
                    </Label>
                    <span className="text-lg font-black text-amber-400">
                      {personalRating.toFixed(1)} <span className="text-xs text-muted-foreground font-normal">/ 10</span>
                    </span>
                  </div>
                  <Slider
                    value={[personalRating]}
                    min={0}
                    max={10}
                    step={0.5}
                    onValueChange={(v) => setPersonalRating(v[0])}
                    className="py-2"
                  />
                </div>
              )}

              {/* Review Input */}
              {status === "watched" ? (
                <div>
                  <Label className="text-xs font-semibold text-zinc-300">Your Review / Impressions</Label>
                  <Textarea
                    rows={2}
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="What did you think of the film? (Optional)"
                    className="mt-1.5 rounded-xl border-white/10 bg-background/50 text-sm focus:border-primary"
                  />
                </div>
              ) : null}

              {/* Private Notes */}
              <div>
                <Label className="text-xs font-semibold text-zinc-300">
                  {status === "watched" ? "Private Notes / Where you watched" : "Private Notes"}
                </Label>
                <Textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes, recommendations, cinema hall... (Optional)"
                  className="mt-1.5 rounded-xl border-white/10 bg-background/50 text-sm focus:border-primary"
                />
              </div>

              {/* Favorite Toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/50 p-3">
                <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-2 cursor-pointer">
                  <Heart className={`h-4 w-4 ${favorite ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                  Mark as Favorite
                </Label>
                <Switch checked={favorite} onCheckedChange={setFavorite} />
              </div>

              {/* Action Submit Button */}
              <div className="pt-1">
                <Button
                  type="button"
                  onClick={handleDialogSubmit}
                  className="w-full rounded-xl py-5 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30"
                >
                  {status === "watched" ? (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Save "{selected.title}" to {status === "watched" ? "Watched" : "Watchlist"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
