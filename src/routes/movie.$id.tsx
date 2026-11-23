import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Heart,
  Star,
  Pencil,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Calendar,
  Clock,
  Loader2,
  RefreshCcw,
  Sparkles,
  Film,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PosterFallback } from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-store";
import { useTmdbMovie } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { TrailerModal } from "@/components/TrailerModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/movie/$id")({ component: MovieDetail });

function MovieDetail() {
  const { id } = Route.useParams();
  const { movies, toggleFavorite, markWatched, moveToWatchlist, deleteMovie, incrementRewatch } =
    useMovies();
  const navigate = useNavigate();
  const movie = movies.find((m) => m.id === id);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const { data: t, isLoading, isFallback, error } = useTmdbMovie(
    movie?.tmdbId ?? 0,
    movie?.cached,
  );

  if (!movie) {
    return (
      <AppShell>
        <div className="py-20 text-center text-muted-foreground">Movie not found in your collection.</div>
      </AppShell>
    );
  }

  const title = t?.title ?? movie.cached?.title ?? "Loading…";
  const backdropUrl = t?.backdrop ?? movie.cached?.backdrop;
  const posterUrl = t?.poster ?? movie.cached?.poster;
  const year = t?.year ?? movie.cached?.year;
  const runtime = t?.runtime ?? movie.cached?.runtime;
  const voteAverage = t?.voteAverage ?? movie.cached?.voteAverage;
  const genres = t?.genres ?? movie.cached?.genres ?? [];
  const overview = t?.overview ?? movie.cached?.overview;

  return (
    <AppShell>
      {/* Back button & quick favorite bar */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
          className="rounded-xl border-white/10 bg-card/60 backdrop-blur-md hover:bg-white/10 text-xs"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>

        <button
          onClick={() => {
            toggleFavorite(movie.id);
            toast(movie.favorite ? "Removed from favorites" : "Added to favorites");
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 backdrop-blur-md transition-all active:scale-95 ${
            movie.favorite
              ? "bg-primary text-white shadow-lg shadow-primary/30"
              : "bg-card/60 text-muted-foreground hover:text-white"
          }`}
          title="Toggle Favorite"
        >
          <Heart className={`h-4 w-4 ${movie.favorite ? "fill-white" : ""}`} />
        </button>
      </div>

      {/* Main Movie Container */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 glass-card shadow-2xl">
        {/* Cinema Backdrop Header */}
        <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden bg-zinc-950">
          {backdropUrl || posterUrl ? (
            <img
              src={backdropUrl || posterUrl}
              alt={title}
              className="h-full w-full object-cover object-center filter brightness-[0.4] transition-transform duration-700 hover:scale-105"
            />
          ) : isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
        </div>

        {/* Content Body - Responsive 2-column layout on Desktop */}
        <div className="relative px-5 pb-8 sm:px-8 sm:pb-10 -mt-24 sm:-mt-32">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Left Column: Poster & Quick Action Card */}
            <div className="w-40 sm:w-52 md:w-64 shrink-0 mx-auto md:mx-0">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl ring-2 ring-white/15">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <PosterFallback title={title} />
                )}
              </div>

              {/* Status & Actions Box */}
              <div className="mt-4 space-y-2.5">
                {/* Watch Official Trailer button */}
                <Button
                  type="button"
                  onClick={() => setTrailerOpen(true)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl border border-red-500/30 shadow-lg shadow-black/50 hover:border-red-500/50 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Play className="mr-2 h-4 w-4 fill-red-500 text-red-500" />
                  Watch Trailer
                </Button>

                {movie.status === "watchlist" ? (
                  <Button
                    onClick={() => {
                      markWatched(movie.id);
                      toast.success("Marked as watched!");
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Watched
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        moveToWatchlist(movie.id);
                        toast("Moved to watchlist");
                      }}
                      className="rounded-xl border-white/10 text-xs"
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Watchlist
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        incrementRewatch(movie.id);
                        toast.success("Rewatch logged!");
                      }}
                      className="rounded-xl border-white/10 text-xs text-primary hover:text-primary"
                    >
                      <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                      Rewatch
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl border-white/10 text-xs"
                  >
                    <Link to="/edit/$id" params={{ id: movie.id }}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit Note
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-xl border-destructive/20 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{title}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove this film from your journal. You can re-add it at any time.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            deleteMovie(movie.id);
                            toast.success("Deleted from journal");
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

            {/* Right Column: Title, Metadata, Overview, and Review */}
            <div className="flex-1 min-w-0 pt-2 sm:pt-4">
              {(isFallback || error) && (
                <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-0.5 text-xs text-amber-400 border border-amber-500/20">
                  <RefreshCcw className="h-3 w-3" />
                  Offline snapshot from journal cache
                </p>
              )}

              {/* Status and Meta Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-semibold text-xs border ${
                    movie.status === "watched"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-primary/15 text-primary border-primary/30"
                  }`}
                >
                  {movie.status === "watched" ? "Watched" : "In Watchlist"}
                </span>

                {year && (
                  <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 border border-white/10">
                    <Calendar className="h-3 w-3" />
                    {year}
                  </span>
                )}

                {runtime ? (
                  <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 border border-white/10">
                    <Clock className="h-3 w-3" />
                    {runtime} min
                  </span>
                ) : null}

                {voteAverage != null && (
                  <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 border border-white/10 text-white">
                    <Star className="h-3 w-3 text-amber-400 fill-current" />
                    TMDB {voteAverage.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Movie Title */}
              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                {title}
              </h1>

              {/* Genres */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 border border-white/5"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Personal Rating Card */}
              {movie.personalRating != null && (
                <div className="mt-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500/15 to-transparent p-4 border border-amber-500/25">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40">
                      <Star className="h-6 w-6 fill-current" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-amber-400 leading-none">
                        {movie.personalRating.toFixed(1)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">/ 10</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Your personal rating</div>
                    </div>
                  </div>

                  {movie.rewatchCount && movie.rewatchCount > 0 ? (
                    <span className="text-xs font-semibold text-primary rounded-full bg-primary/10 px-3 py-1 border border-primary/20">
                      Rewatched {movie.rewatchCount}×
                    </span>
                  ) : null}
                </div>
              )}

              {/* Overview */}
              {overview && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Storyline Overview
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-300">{overview}</p>
                </div>
              )}

              {/* User Review */}
              {movie.review && (
                <div className="mt-6 rounded-2xl border-l-4 border-primary bg-primary/10 p-4 border-r border-t border-b border-primary/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Your Review & Impressions
                  </h3>
                  <p className="text-sm italic leading-relaxed text-zinc-200">{movie.review}</p>
                </div>
              )}

              {/* Private Notes */}
              {movie.notes && (
                <div className="mt-4 rounded-2xl bg-white/5 p-4 border border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Private Notes & Location
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-300">{movie.notes}</p>
                </div>
              )}

              {/* Screening Date */}
              {movie.watchDate && (
                <p className="mt-5 text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Screened on {new Date(movie.watchDate).toLocaleDateString(undefined, { dateStyle: "long" })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <TrailerModal
        isOpen={trailerOpen}
        onOpenChange={setTrailerOpen}
        tmdbId={movie.tmdbId}
        title={title}
      />
    </AppShell>
  );
}
