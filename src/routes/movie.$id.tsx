import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, Heart, Star, Pencil, Trash2, CheckCircle2, RotateCcw, Calendar, Clock, Loader2, RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PosterFallback } from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-store";
import { useTmdbMovie } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/movie/$id")({ component: MovieDetail });

function MovieDetail() {
  const { id } = Route.useParams();
  const { movies, toggleFavorite, markWatched, moveToWatchlist, deleteMovie, incrementRewatch } =
    useMovies();
  const navigate = useNavigate();
  const movie = movies.find((m) => m.id === id);

  const { data: t, isLoading, isFallback, error } = useTmdbMovie(
    movie?.tmdbId ?? 0,
    movie?.cached,
  );

  if (!movie) {
    return (
      <AppShell>
        <div className="py-20 text-center text-muted-foreground">Movie not found.</div>
      </AppShell>
    );
  }

  const title = t?.title ?? "Loading…";

  return (
    <div className="relative min-h-screen pb-32">
      <div className="relative h-[380px] w-full overflow-hidden bg-muted">
        {t?.backdrop || t?.poster ? (
          <img
            src={t.backdrop || t.poster}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="h-full w-full">
            <PosterFallback title={title} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Link to="/" className="glass flex h-10 w-10 items-center justify-center rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <button
            onClick={() => {
              toggleFavorite(movie.id);
              toast(movie.favorite ? "Removed from favorites" : "Added to favorites");
            }}
            className="glass flex h-10 w-10 items-center justify-center rounded-full"
          >
            <Heart className={`h-4 w-4 ${movie.favorite ? "fill-primary text-primary" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mx-auto -mt-16 w-full max-w-2xl px-4">
        <div className="rounded-3xl bg-card p-6 ring-1 ring-border shadow-xl shadow-black/40 animate-fade-in">
          {(isFallback || error) && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] text-amber-400">
              <RefreshCcw className="h-3 w-3" />
              Showing cached info — couldn't reach TMDB
            </p>
          )}
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
            <span
              className={`rounded-full px-2 py-0.5 ${
                movie.status === "watched"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-blue-500/15 text-blue-400"
              }`}
            >
              {movie.status === "watched" ? "Watched" : "Watchlist"}
            </span>
            {t?.voteAverage != null && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3" />
                TMDB {t.voteAverage.toFixed(1)}
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-semibold leading-tight">{title}</h1>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(t?.genres ?? []).map((g) => (
              <span
                key={g}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
              >
                {g}
              </span>
            ))}
          </div>

          {movie.status === "watched" && movie.personalRating != null && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-gold/10 p-4">
              <Star className="h-5 w-5 fill-current text-gold" />
              <div className="text-2xl font-bold text-gold">
                {movie.personalRating.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">/ 10 · your rating</div>
              {movie.rewatchCount > 0 && (
                <div className="ml-auto text-xs text-muted-foreground">
                  Rewatched {movie.rewatchCount}×
                </div>
              )}
            </div>
          )}

          {t?.overview && (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Overview
              </h3>
              <p className="text-sm leading-relaxed">{t.overview}</p>
            </div>
          )}

          {movie.review && (
            <div className="mt-6 rounded-2xl border-l-4 border-primary bg-primary/5 p-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Your review
              </h3>
              <p className="text-sm italic leading-relaxed">{movie.review}</p>
            </div>
          )}

          {movie.notes && (
            <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Private notes
              </h3>
              <p className="text-sm leading-relaxed">{movie.notes}</p>
            </div>
          )}

          {movie.watchDate && (
            <p className="mt-4 text-xs text-muted-foreground">
              Watched on {new Date(movie.watchDate).toLocaleDateString()}
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2">
            {movie.status === "watchlist" ? (
              <Button
                onClick={() => {
                  markWatched(movie.id);
                  toast.success("Marked as watched");
                }}
                className="col-span-2 gradient-primary text-white"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Watched
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    moveToWatchlist(movie.id);
                    toast("Moved back to watchlist");
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Watchlist
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    incrementRewatch(movie.id);
                    toast.success("Rewatch logged");
                  }}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Rewatch
                </Button>
              </>
            )}
            <Link to="/edit/$id" params={{ id: movie.id }}>
              <Button variant="outline" className="w-full">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{title}"?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteMovie(movie.id);
                      toast.success("Deleted");
                      navigate({ to: "/" });
                    }}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
