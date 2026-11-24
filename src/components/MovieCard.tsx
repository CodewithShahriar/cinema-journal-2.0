import { Link } from "@tanstack/react-router";
import { Heart, Star, Clock, Calendar, Loader2, CheckCircle2, Bookmark, Eye } from "lucide-react";
import type { TrackedMovie } from "@/lib/movie-types";
import { useMovies } from "@/lib/movies-store";
import { useTmdbMovie } from "@/lib/tmdb";

export function PosterFallback({ title }: { title: string }) {
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-2xl font-black text-primary/70">
      {initials || "?"}
    </div>
  );
}

interface MovieCardProps {
  movie: TrackedMovie;
  variant?: "grid" | "row";
}

export function MovieCard({ movie, variant = "grid" }: MovieCardProps) {
  const { toggleFavorite, markWatched } = useMovies();
  const { data: t, isLoading } = useTmdbMovie(movie.tmdbId, movie.cached);
  const title = t?.title ?? movie.cached?.title ?? "Loading…";
  const posterUrl = t?.poster ?? movie.cached?.poster;
  const year = t?.year ?? movie.cached?.year;
  const runtime = t?.runtime ?? movie.cached?.runtime;
  const genres = t?.genres ?? movie.cached?.genres ?? [];
  const rating = movie.personalRating ?? (t?.voteAverage ? Number(t.voteAverage.toFixed(1)) : null);

  // Grid / Poster Card Layout (Netflix / Letterboxd Cinematic Card)
  if (variant === "grid") {
    return (
      <div className="group relative flex flex-col overflow-hidden rounded-2xl glass-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 animate-reveal-card">
        <Link
          to="/movie/$id"
          params={{ id: movie.id }}
          className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900"
        >
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : isLoading ? (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-zinc-900/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <PosterFallback title={title} />
          )}

          {/* Top Status & Favorite Badges */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2.5 bg-gradient-to-b from-black/80 via-black/30 to-transparent">
            {movie.status === "watched" ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 backdrop-blur-md border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" />
                Watched
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur-md border border-primary/30">
                <Bookmark className="h-3 w-3" />
                Watchlist
              </span>
            )}

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(movie.id);
              }}
              aria-label="Toggle favorite"
              className={`flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-90 ${
                movie.favorite
                  ? "bg-primary text-white shadow-lg shadow-primary/40 ring-1 ring-white/30"
                  : "bg-black/50 text-white/70 hover:bg-black/80 hover:text-white"
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 transition-transform ${
                  movie.favorite ? "fill-white scale-110" : ""
                }`}
              />
            </button>
          </div>

          {/* Bottom Gradient overlay on poster for quick metadata */}
          <div className="absolute inset-x-0 bottom-0 p-2.5 pt-8 bg-gradient-to-t from-black via-black/70 to-transparent flex items-end justify-between">
            {rating != null ? (
              <div className="flex items-center gap-1 rounded-lg bg-black/60 px-2 py-0.5 text-xs font-bold text-amber-400 backdrop-blur-md border border-amber-500/20">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{rating.toFixed(1)}</span>
              </div>
            ) : (
              <div />
            )}

            {year ? (
              <span className="text-[11px] font-medium text-white/80 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">
                {year}
              </span>
            ) : null}
          </div>
        </Link>

        {/* Card Title & Info */}
        <div className="p-3 flex flex-col flex-1 justify-between gap-2 bg-card/60 backdrop-blur-sm">
          <div>
            <Link
              to="/movie/$id"
              params={{ id: movie.id }}
              className="line-clamp-1 font-semibold text-sm text-foreground hover:text-primary transition-colors"
              title={title}
            >
              {title}
            </Link>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
              {runtime ? (
                <span className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3 text-zinc-400" />
                  {runtime}m
                </span>
              ) : null}
              {runtime && genres.length > 0 ? (
                <span className="text-white/20 shrink-0">•</span>
              ) : null}
              {genres.length > 0 ? (
                <span
                  className="truncate text-zinc-400 font-medium hover:text-zinc-200 transition-colors"
                  title={genres.join(", ")}
                >
                  {genres.slice(0, 2).join(", ")}
                </span>
              ) : null}
              {movie.rewatchCount && movie.rewatchCount > 0 ? (
                <span className="text-primary font-medium shrink-0 ml-auto pl-1">
                  {movie.rewatchCount}×
                </span>
              ) : null}
            </div>
          </div>

          {movie.status === "watchlist" && (
            <button
              onClick={() => markWatched(movie.id)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30 border border-transparent transition-all"
            >
              <CheckCircle2 className="h-3 w-3" />
              Mark Watched
            </button>
          )}
        </div>
      </div>
    );
  }

  // Row / Compact List Layout
  return (
    <Link
      to="/movie/$id"
      params={{ id: movie.id }}
      className="group relative flex gap-3.5 rounded-2xl glass-card p-3 shadow-lg shadow-black/40 ring-1 ring-border transition-all hover:-translate-y-0.5 hover:ring-primary/40 animate-reveal-card"
    >
      <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-900 shadow-md">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : isLoading ? (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <PosterFallback title={title} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors">
              {title}
            </h3>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(movie.id);
              }}
              aria-label="Toggle favorite"
              className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-all hover:bg-white/10 hover:text-primary active:scale-90"
            >
              <Heart
                className={`h-4 w-4 ${movie.favorite ? "fill-primary text-primary" : ""}`}
              />
            </button>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
            {year && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {year}
              </span>
            )}
            {runtime ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {runtime}m
              </span>
            ) : null}
            {genres.length > 0 && (
              <span className="inline-flex items-center text-zinc-400 font-medium">
                {genres.slice(0, 2).join(", ")}
              </span>
            )}
            {rating != null && (
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="h-3 w-3 fill-current" />
                {rating.toFixed(1)}
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                movie.status === "watched"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-primary/15 text-primary"
              }`}
            >
              {movie.status === "watched" ? "Watched" : "Watchlist"}
            </span>
          </div>
        </div>

        {movie.notes && (
          <p className="line-clamp-1 text-xs italic text-muted-foreground/80 mt-1">
            "{movie.notes}"
          </p>
        )}
      </div>
    </Link>
  );
}

export function EmptyState({
  title,
  hint,
  icon: Icon,
}: {
  title: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-card/40 py-16 px-4 text-center backdrop-blur-md animate-reveal-card">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/10">
        <Icon className="h-8 w-8" />
      </div>
      <p className="font-semibold text-foreground text-base">{title}</p>
      {hint && <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
