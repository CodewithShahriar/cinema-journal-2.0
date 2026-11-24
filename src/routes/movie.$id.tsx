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
  Users,
  Clapperboard,
  Plus,
  BookOpen,
  ChevronDown,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PosterFallback } from "@/components/MovieCard";
import { useMovies } from "@/lib/movies-store";
import {
  useTmdbMovie,
  useTmdbCredits,
  useTmdbRecommendations,
  useTmdbExtendedPlot,
} from "@/lib/tmdb";
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

export const Route = createFileRoute("/movie/$id")({
  component: MovieDetail,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="py-16 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-white">Movie Information Unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message || "Could not load details for this film."}
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
        >
          Go Back
        </button>
      </div>
    </AppShell>
  ),
});

function formatCurrency(amount?: number): string | null {
  if (!amount || amount <= 0) return null;
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  return `$${amount.toLocaleString()}`;
}

function MovieDetail() {
  const { id } = Route.useParams();
  const {
    movies,
    toggleFavorite,
    markWatched,
    moveToWatchlist,
    deleteMovie,
    incrementRewatch,
    addByTmdb,
  } = useMovies();
  const navigate = useNavigate();
  const movie = movies.find((m) => m.id === id);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [showFullPlot, setShowFullPlot] = useState(false);

  const { data: t, isLoading, isFallback, error } = useTmdbMovie(
    movie?.tmdbId ?? 0,
    movie?.cached,
  );
  const { data: credits } = useTmdbCredits(movie?.tmdbId ?? 0);
  const { data: recommendations } = useTmdbRecommendations(movie?.tmdbId ?? 0);

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
  const tagline = t?.tagline;
  const budget = t?.budget;
  const revenue = t?.revenue;
  const originalLanguage = t?.originalLanguage;

  const { data: extendedPlotData } = useTmdbExtendedPlot(title, year);

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
            <div className="flex-1 min-w-0 pt-2 sm:pt-6 md:pt-12 lg:pt-16">
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

              {/* Tagline */}
              {tagline && (
                <div className="mt-2 text-xs sm:text-sm italic font-medium text-primary/90 flex items-center gap-1.5">
                  <span className="text-base text-primary/40 font-serif">“</span>
                  <span>{tagline}</span>
                  <span className="text-base text-primary/40 font-serif">”</span>
                </div>
              )}

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

              {/* Personal Rating Card (Watched) OR Watchlist Prompt Banner (Watchlist) */}
              {movie.personalRating != null ? (
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
                  ) : movie.watchDate ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(movie.watchDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  ) : null}
                </div>
              ) : movie.status === "watchlist" ? (
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary/15 via-white/[0.04] to-transparent p-3.5 sm:p-4 border border-primary/25 shadow-lg shadow-black/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shrink-0">
                      <Bookmark className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white">Up Next on Watchlist</div>
                      <div className="text-[11px] text-muted-foreground">
                        Planned for movie night • Ready to watch?
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      markWatched(movie.id);
                      toast.success("Marked as watched! You can now rate and review.");
                    }}
                    className="rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-md shadow-primary/25 shrink-0"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Mark Watched
                  </Button>
                </div>
              ) : null}

              {/* Storyline Overview & Extended Synopsis */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    Storyline Overview
                  </h3>
                  {extendedPlotData?.plot && (
                    <button
                      type="button"
                      onClick={() => setShowFullPlot((prev) => !prev)}
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      {showFullPlot ? "Show Short Synopsis" : "Read Full Story / Plot"}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${showFullPlot ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>

                {showFullPlot && extendedPlotData?.plot ? (
                  <div className="rounded-2xl bg-black/40 p-4 border border-white/10 text-sm leading-relaxed text-zinc-300 space-y-3 max-h-80 overflow-y-auto pr-3 scrollbar-thin">
                    {extendedPlotData.plot.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm sm:text-base leading-relaxed text-zinc-200/90 font-normal">
                    {overview || extendedPlotData?.summary || "No overview available for this film."}
                  </p>
                )}
              </div>

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

      {/* Cast & Director Section */}
      {((credits?.directors && credits.directors.length > 0) ||
        (credits?.cast && credits.cast.length > 0)) && (
        <section className="mt-8 rounded-3xl border border-white/10 glass-card p-5 sm:p-7 shadow-xl">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Cast & Directors
              </h2>
              <p className="text-xs text-muted-foreground">The visionaries and performers</p>
            </div>
          </div>

          {/* Directors Showcase */}
          {credits?.directors && credits.directors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clapperboard className="h-3.5 w-3.5 text-primary" />
                Directed by
              </h3>
              <div className="flex flex-wrap gap-3">
                {credits.directors.map((d) => (
                  <div
                    key={`${d.id}-${d.name}`}
                    className="flex items-center gap-3 rounded-2xl bg-white/5 p-2.5 pr-4 border border-white/10 hover:border-primary/40 transition-all"
                  >
                    {d.profilePath ? (
                      <img
                        src={d.profilePath}
                        alt={d.name}
                        className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/15 shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-sm font-bold text-zinc-300 ring-1 ring-white/10 shrink-0">
                        {d.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-white">{d.name}</div>
                      <div className="text-xs text-primary font-medium">Director</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Cast Avatars with Smooth Horizontal Scroll */}
          {credits?.cast && credits.cast.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Key Cast
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                {credits.cast.map((actor) => (
                  <div
                    key={actor.id}
                    className="group/cast flex flex-col items-center w-24 sm:w-28 shrink-0 text-center"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 shadow-md transition-transform duration-300 group-hover/cast:scale-105 group-hover/cast:border-primary/40">
                      {actor.profilePath ? (
                        <img
                          src={actor.profilePath}
                          alt={actor.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs font-bold text-zinc-400">
                          {actor.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 w-full px-0.5">
                      <div
                        className="truncate text-xs font-semibold text-white group-hover/cast:text-primary transition-colors"
                        title={actor.name}
                      >
                        {actor.name}
                      </div>
                      <div
                        className="truncate text-[10px] text-muted-foreground"
                        title={actor.character}
                      >
                        {actor.character || "Cast"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Similar Movies & Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <section className="mt-8 rounded-3xl border border-white/10 glass-card p-5 sm:p-7 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  More Like This
                </h2>
                <p className="text-xs text-muted-foreground">
                  Handpicked recommendations based on this movie
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {recommendations.map((rec) => {
              const existingMovie = movies.find((m) => m.tmdbId === rec.id);

              return (
                <div
                  key={rec.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-card/60 border border-white/10 shadow-lg hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
                    {rec.poster ? (
                      <img
                        src={rec.poster}
                        alt={rec.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <PosterFallback title={rec.title} />
                    )}

                    {rec.voteAverage != null && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-amber-400 backdrop-blur-md border border-amber-500/20">
                        <Star className="h-3 w-3 fill-current" />
                        {rec.voteAverage.toFixed(1)}
                      </div>
                    )}

                    {rec.year ? (
                      <div className="absolute bottom-2 right-2 text-[10px] font-medium text-white/80 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                        {rec.year}
                      </div>
                    ) : null}
                  </div>

                  <div className="p-2.5 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <h4
                        className="line-clamp-1 text-xs font-semibold text-white group-hover:text-primary transition-colors"
                        title={rec.title}
                      >
                        {rec.title}
                      </h4>
                    </div>

                    {existingMovie ? (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-7 w-full text-[11px] rounded-lg border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 font-medium"
                      >
                        <Link to="/movie/$id" params={{ id: existingMovie.id }}>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          In Journal
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          addByTmdb({
                            tmdbId: rec.id,
                            status: "watchlist",
                            cached: {
                              id: rec.id,
                              title: rec.title,
                              poster: rec.poster,
                              year: rec.year,
                              genres: [],
                              voteAverage: rec.voteAverage,
                              overview: rec.overview,
                            },
                          });
                          toast.success(`Added "${rec.title}" to Watchlist!`);
                        }}
                        className="h-7 w-full text-[11px] rounded-lg border-white/10 bg-white/5 hover:bg-primary/20 hover:text-primary hover:border-primary/40 font-medium transition-all"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Watchlist
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <TrailerModal
        isOpen={trailerOpen}
        onOpenChange={setTrailerOpen}
        tmdbId={movie.tmdbId}
        title={title}
      />
    </AppShell>
  );
}
