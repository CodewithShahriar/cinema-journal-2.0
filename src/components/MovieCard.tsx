import { Link } from "@tanstack/react-router";
import { Heart, Star, Clock, Calendar, Loader2 } from "lucide-react";
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
    <div className="flex h-full w-full items-center justify-center gradient-primary text-3xl font-black text-white/90">
      {initials || "?"}
    </div>
  );
}

export function MovieCard({ movie }: { movie: TrackedMovie }) {
  const { toggleFavorite } = useMovies();
  const { data: t, isLoading } = useTmdbMovie(movie.tmdbId, movie.cached);
  const title = t?.title ?? "Loading…";

  return (
    <Link
      to="/movie/$id"
      params={{ id: movie.id }}
      className="group relative flex gap-3 rounded-2xl bg-card p-3 shadow-lg shadow-black/30 ring-1 ring-border transition-all hover:-translate-y-0.5 hover:ring-primary/40 animate-fade-in"
    >
      <div className="relative h-32 w-[86px] shrink-0 overflow-hidden rounded-xl bg-muted">
        {t?.poster ? (
          <img
            src={t.poster}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : isLoading ? (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <PosterFallback title={title} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold leading-snug">{title}</h3>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(movie.id);
            }}
            aria-label="Toggle favorite"
            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
          >
            <Heart className={`h-4 w-4 ${movie.favorite ? "fill-primary text-primary" : ""}`} />
          </button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {t?.year && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {t.year}
            </span>
          )}
          {t?.runtime ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t.runtime}m
            </span>
          ) : null}
          {t?.voteAverage != null && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3" />
              {t.voteAverage.toFixed(1)}
            </span>
          )}
          {movie.status === "watched" && movie.personalRating != null && (
            <span className="inline-flex items-center gap-1 text-gold">
              <Star className="h-3 w-3 fill-current" />
              {movie.personalRating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {(t?.genres ?? []).slice(0, 3).map((g: string) => (
            <span
              key={g}
              className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
            >
              {g}
            </span>
          ))}
        </div>
        {movie.notes && (
          <p className="mt-auto line-clamp-2 pt-2 text-xs italic text-muted-foreground">
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
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 text-center animate-fade-in">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-white shadow-lg">
        <Icon className="h-8 w-8" />
      </div>
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
