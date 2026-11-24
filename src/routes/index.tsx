import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Film,
  Bookmark,
  CheckCircle2,
  Heart,
  Star,
  BarChart3,
  TrendingUp,
  Plus,
  Play,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMovies } from "@/lib/movies-store";
import { AppShell } from "@/components/AppShell";
import { MovieCard, EmptyState } from "@/components/MovieCard";
import { Progress } from "@/components/ui/progress";
import { TmdbSearchPicker } from "@/components/TmdbSearchPicker";
import { Button } from "@/components/ui/button";
import { TrailerModal } from "@/components/TrailerModal";
import { CineWrappedModal } from "@/components/CineWrappedModal";

export const Route = createFileRoute("/")({
  component: Home,
  errorComponent: ({ error }) => {
    return (
      <AppShell>
        <div className="py-16 text-center max-w-md mx-auto">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
            <Film className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error?.message || "Could not load the cinema dashboard."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
          >
            Refresh Dashboard
          </button>
        </div>
      </AppShell>
    );
  },
  head: () => ({
    meta: [
      { title: "CineJournal — Netflix Style Cinema Tracker" },
      {
        name: "description",
        content:
          "An ultra-modern, private movie & series journal powered by TMDB with multi-device cloud sync.",
      },
      { property: "og:title", content: "CineJournal — Cinema Tracker" },
      { property: "og:description", content: "Track, rate, and remember every film you love." },
    ],
  }),
});

function StatBox({
  icon: Icon,
  label,
  value,
  tint,
  className,
  horizontalOnMobile = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tint?: string;
  className?: string;
  horizontalOnMobile?: boolean;
}) {
  if (horizontalOnMobile) {
    return (
      <div
        className={`glass-card rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-md flex items-center justify-between lg:flex-col lg:items-stretch lg:justify-between transition-all hover:border-primary/40 group ${className ?? ""}`}
      >
        {/* Mobile horizontal banner layout */}
        <div className="flex items-center gap-2 lg:hidden">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${
              tint ?? "bg-primary/15 text-primary"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="text-base sm:text-lg font-black tracking-tight text-amber-400 lg:hidden">
          {value}
        </div>

        {/* Desktop 5-column layout */}
        <div className="hidden lg:flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${
              tint ?? "bg-primary/15 text-primary"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="hidden lg:block mt-2 text-xl font-black tracking-tight text-white">
          {value}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass-card rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-md flex flex-col justify-between transition-all hover:border-primary/40 group ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{label}</span>
        <div
          className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${
            tint ?? "bg-primary/15 text-primary"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-black tracking-tight text-white">{value}</div>
    </div>
  );
}

function Home() {
  const { movies, hydrated } = useMovies();
  const total = movies.length;
  const watched = movies.filter((m) => m.status === "watched");
  const watchlist = movies.filter((m) => m.status === "watchlist");
  const favorites = movies.filter((m) => m.favorite);
  const rated = watched.filter((m) => m.personalRating != null);
  const avg = rated.length
    ? rated.reduce((s, m) => s + (m.personalRating ?? 0), 0) / rated.length
    : 0;
  const pct = total ? Math.round((watched.length / total) * 100) : 0;

  const recent = [...watched]
    .sort((a, b) => String(b.watchDate ?? "").localeCompare(String(a.watchDate ?? "")))
    .slice(0, 6);

  const upNext = [...watchlist].slice(0, 6);

  // 1st Priority: Latest additions to Watchlist (sorted by createdAt descending)
  const recentWatchlist = [...watchlist].sort((a, b) =>
    String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))
  );

  // Collect up to 5 unique movies for the rotating Hero banner
  const heroCandidates: typeof movies = [];
  const seenIds = new Set<string>();

  for (const m of recentWatchlist) {
    if (m.cached && !seenIds.has(m.id)) {
      heroCandidates.push(m);
      seenIds.add(m.id);
      if (heroCandidates.length >= 5) break;
    }
  }

  // If watchlist has fewer than 5 movies, fill up with other library movies
  if (heroCandidates.length < 5) {
    const supplement = [...favorites, ...recent, ...movies];
    for (const m of supplement) {
      if (m.cached && !seenIds.has(m.id)) {
        heroCandidates.push(m);
        seenIds.add(m.id);
        if (heroCandidates.length >= 5) break;
      }
    }
  }

  // Infinite looping track with cloned boundaries: [Last, ...Originals, First]
  const slides = useMemo(() => {
    if (heroCandidates.length <= 1)
      return heroCandidates.map((m) => ({ ...m, _slideKey: m.id }));
    const first = heroCandidates[0];
    const last = heroCandidates[heroCandidates.length - 1];
    return [
      { ...last, _slideKey: `clone-last-${last.id}` },
      ...heroCandidates.map((m) => ({ ...m, _slideKey: `orig-${m.id}` })),
      { ...first, _slideKey: `clone-first-${first.id}` },
    ];
  }, [heroCandidates]);

  const [slideIndex, setSlideIndex] = useState(1);
  const [withAnimation, setWithAnimation] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Active display index (0 to heroCandidates.length - 1)
  const activeDisplayIndex = useMemo(() => {
    if (heroCandidates.length <= 1) return 0;
    return (slideIndex - 1 + heroCandidates.length) % heroCandidates.length;
  }, [slideIndex, heroCandidates.length]);

  const handleNext = useCallback(() => {
    if (heroCandidates.length <= 1) return;
    setWithAnimation(true);
    setSlideIndex((prev) => prev + 1);
  }, [heroCandidates.length]);

  const handlePrev = useCallback(() => {
    if (heroCandidates.length <= 1) return;
    setWithAnimation(true);
    setSlideIndex((prev) => prev - 1);
  }, [heroCandidates.length]);

  // 5-second automatic rotation
  useEffect(() => {
    if (heroCandidates.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [heroCandidates.length, isPaused, handleNext]);

  // Seamless jump without animation when reaching clone boundaries
  const handleTransitionEnd = () => {
    if (heroCandidates.length <= 1) return;
    if (slideIndex >= heroCandidates.length + 1) {
      // Reached cloned first slide at the end -> silently snap back to real first slide
      setWithAnimation(false);
      setSlideIndex(1);
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setWithAnimation(true);
          });
        });
      } else {
        setWithAnimation(true);
      }
    } else if (slideIndex <= 0) {
      // Reached cloned last slide at the beginning -> silently snap back to real last slide
      setWithAnimation(false);
      setSlideIndex(heroCandidates.length);
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setWithAnimation(true);
          });
        });
      } else {
        setWithAnimation(true);
      }
    }
  };

  const jumpToSlide = (i: number) => {
    setWithAnimation(true);
    setSlideIndex(i + 1);
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const [trailerMovie, setTrailerMovie] = useState<{ id: number; title: string } | null>(null);
  const [wrappedOpen, setWrappedOpen] = useState(false);

  return (
    <AppShell>
      {/* Cinematic Netflix Spotlight Hero (5-Movie Auto Carousel with Right-to-Left Sliding) */}
      {heroCandidates.length > 0 && heroCandidates[0]?.cached ? (
        <section
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="group/hero relative mb-6 sm:mb-8 overflow-hidden rounded-3xl border border-white/10 shadow-2xl transition-all h-[440px] sm:h-[480px] md:h-[540px] lg:h-[620px] xl:h-[680px] select-none"
        >
          {/* Horizontal Slider Track for Seamless Infinite Right-to-Left Slide Transitions */}
          <div
            onTransitionEnd={handleTransitionEnd}
            className={`flex h-full w-full ${
              withAnimation
                ? "transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                : "transition-none"
            } will-change-transform`}
            style={{
              transform: `translateX(-${(heroCandidates.length > 1 ? slideIndex : 0) * 100}%)`,
            }}
          >
            {slides.map((c) => {
              const bg = c.cached?.backdrop || c.cached?.poster;
              return (
                <div
                  key={c._slideKey}
                  className="relative h-full w-full shrink-0 flex flex-col justify-end bg-zinc-950 overflow-hidden"
                >
                  {/* Backdrop Image */}
                  {bg ? (
                    <img
                      src={bg}
                      alt={c.cached?.title}
                      className="absolute inset-0 h-full w-full object-cover object-[center_18%] filter brightness-[0.65]"
                    />
                  ) : null}

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent pointer-events-none" />

                  {/* Slide Content */}
                  <div className="relative z-10 p-4 sm:p-8 md:p-12 lg:p-16">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {c.status === "watchlist" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-primary backdrop-blur-md border border-primary/30">
                          <Bookmark className="h-3 w-3 fill-primary" />
                          Watchlist
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-white/90 backdrop-blur-md border border-white/20">
                          <Film className="h-3 w-3" />
                          Featured
                        </span>
                      )}

                      {c.cached?.year && (
                        <span className="inline-flex items-center rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-white/90 backdrop-blur-md border border-white/15">
                          {c.cached.year}
                        </span>
                      )}

                      {Array.isArray(c.cached?.genres) && c.cached.genres.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-zinc-300 backdrop-blur-md border border-white/15">
                          {c.cached.genres.slice(0, 3).join(" • ")}
                        </span>
                      )}
                    </div>

                    <h1 className="font-display text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white max-w-3xl drop-shadow-lg leading-tight tracking-tight">
                      {c.cached?.title}
                    </h1>

                    {c.cached?.overview && (
                      <p className="mt-2 line-clamp-2 max-w-xl text-xs sm:text-sm md:text-base leading-relaxed text-zinc-300 drop-shadow">
                        {c.cached.overview}
                      </p>
                    )}

                    {/* Mobile: 2-column grid. Desktop: Sleek inline row */}
                    <div className="mt-3.5 sm:mt-6 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <Button
                        asChild
                        className="h-10 sm:h-12 px-3 sm:px-6 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-xl shadow-primary/35 transition-all hover:scale-105 active:scale-95 justify-center"
                      >
                        <Link to="/movie/$id" params={{ id: c.id }}>
                          <Play className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 fill-white shrink-0" />
                          <span className="truncate">View Details</span>
                        </Link>
                      </Button>

                      {c.tmdbId ? (
                        <Button
                          type="button"
                          onClick={() =>
                            setTrailerMovie({
                              id: c.tmdbId,
                              title: c.cached?.title || "Movie Trailer",
                            })
                          }
                          variant="outline"
                          className="h-10 sm:h-12 px-3 sm:px-5 rounded-xl sm:rounded-2xl border-white/20 bg-black/60 text-white backdrop-blur-md hover:bg-white/15 text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg justify-center"
                        >
                          <Film className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 shrink-0" />
                          <span className="truncate">Watch Trailer</span>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Controls: Manual Navigation & Indicator */}
          {heroCandidates.length > 1 && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-1.5 sm:gap-2">
              <span className="hidden sm:inline-flex text-[11px] font-mono text-white/70 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
                {activeDisplayIndex + 1} / {heroCandidates.length}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous movie"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all active:scale-90"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next movie"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all active:scale-90"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Bottom Right 5-Slide Pill Indicators (Desktop only to prevent clashing with mobile action buttons) */}
          {heroCandidates.length > 1 && (
            <div className="hidden sm:flex absolute sm:bottom-8 sm:right-8 z-20 items-center gap-1.5">
              {heroCandidates.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => jumpToSlide(i)}
                  aria-label={`Jump to movie ${i + 1}: ${c.cached?.title}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === activeDisplayIndex
                      ? "w-7 bg-primary shadow-lg shadow-primary/60"
                      : "w-2 bg-white/30 hover:bg-white/60 hover:w-3"
                  }`}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Welcome Hero for New Visitors */
        <section className="relative mb-6 sm:mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-card via-card/70 to-background p-6 sm:p-10 shadow-2xl">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary border border-primary/25 mb-3">
              <Film className="h-3.5 w-3.5" />
              CineJournal 2.0
            </span>
            <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
              Track, rate and remember every film you love.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Search millions of movies powered by TMDB, rate what you've watched, and sync
              effortlessly across your phone and desktop.
            </p>
          </div>
        </section>
      )}

      {/* TMDB Live Search Bar */}
      <div className="mb-6 sm:mb-8">
        <TmdbSearchPicker compact />
      </div>

      {/* Statistics Cards - Responsive perfectly aligned layout */}
      <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
        <StatBox icon={Film} label="Total Movies" value={total} />
        <StatBox
          icon={CheckCircle2}
          label="Watched"
          value={watched.length}
          tint="bg-emerald-500/15 text-emerald-400"
        />
        <StatBox
          icon={Bookmark}
          label="Watchlist"
          value={watchlist.length}
          tint="bg-sky-500/15 text-sky-400"
        />
        <StatBox
          icon={Heart}
          label="Favorites"
          value={favorites.length}
          tint="bg-pink-500/15 text-pink-400"
        />
        <StatBox
          icon={Star}
          label="Avg Rating"
          value={avg ? `${avg.toFixed(1)} ★` : "—"}
          tint="bg-amber-500/15 text-amber-400"
          className="col-span-2 lg:col-span-1"
          horizontalOnMobile
        />
      </div>

      {/* Watch Completion Progress Card */}
      {total > 0 && (
        <div className="glass-card mb-6 sm:mb-8 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-foreground">Collection Completion</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-primary">{pct}% Watched</span>
          </div>
          <Progress value={pct} className="h-2 bg-zinc-800" />
          <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground">
            <span>{watched.length} watched</span>
            <span>{watchlist.length} pending on watchlist</span>
          </div>
        </div>
      )}

      {/* Recently Watched Shelf */}
      <section className="mb-8 sm:mb-10">
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg sm:text-2xl font-bold tracking-tight text-white">
              Recently Watched
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Your latest film screenings</p>
          </div>
          {recent.length > 0 && (
            <Link
              to="/watched"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              View all ({watched.length})
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {!hydrated ? null : recent.length === 0 ? (
          <EmptyState
            icon={Film}
            title="No watched movies yet"
            hint="Search for any film above to rate it and add to your watched list."
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-4">
            {recent.map((m) => (
              <MovieCard key={m.id} movie={m} variant="grid" />
            ))}
          </div>
        )}
      </section>

      {/* Up Next on Watchlist Shelf */}
      {watchlist.length > 0 && (
        <section className="mb-8 sm:mb-10">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg sm:text-2xl font-bold tracking-tight text-white">
                Up Next on Watchlist
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Planned for movie night</p>
            </div>
            <Link
              to="/watchlist"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              View all ({watchlist.length})
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-4">
            {upNext.map((m) => (
              <MovieCard key={m.id} movie={m} variant="grid" />
            ))}
          </div>
        </section>
      )}

      {/* CineWrapped Annual Story Recap Footer Banner */}
      {watched.length > 0 && (
        <section className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl border border-red-500/25 bg-gradient-to-r from-red-950/40 via-zinc-900/60 to-black backdrop-blur-md shadow-xl transition-all hover:border-red-500/40">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-inner">
                <Film className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Your CineWrapped Recap
                  </h3>
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-black text-primary border border-primary/30 uppercase">
                    Annual Story
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  Explore your cinema archetype, top rated films, and total hours watched.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setWrappedOpen(true)}
              className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shrink-0 shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all self-center sm:self-auto"
            >
              Launch Wrapped
            </Button>
          </div>
        </section>
      )}

      {/* Trailer & Wrapped Modals */}
      <TrailerModal
        isOpen={Boolean(trailerMovie)}
        onOpenChange={(open) => !open && setTrailerMovie(null)}
        tmdbId={trailerMovie?.id}
        title={trailerMovie?.title}
      />
      <CineWrappedModal
        isOpen={wrappedOpen}
        onOpenChange={setWrappedOpen}
      />
    </AppShell>
  );
}
