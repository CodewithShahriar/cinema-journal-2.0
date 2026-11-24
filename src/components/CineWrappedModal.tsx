import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMovies, type MovieItem } from "@/lib/movies-store";
import {
  Film,
  Clock,
  Star,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Share2,
  Trophy,
  Heart,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface CineWrappedModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CineWrappedModal({ isOpen, onOpenChange }: CineWrappedModalProps) {
  const { movies } = useMovies();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Available years from watched movies
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    movies.forEach((m) => {
      if (m.status === "watched" && m.watchDate) {
        const y = m.watchDate.slice(0, 4);
        if (/^\d{4}$/.test(y)) years.add(y);
      }
    });
    const sorted = [...years].sort((a, b) => b.localeCompare(a));
    return ["all", ...sorted];
  }, [movies]);

  const [selectedYear, setSelectedYear] = useState<string>("all");

  // Filter movies for selected year
  const filteredWatched = useMemo(() => {
    const watched = movies.filter((m) => m.status === "watched");
    if (selectedYear === "all") return watched;
    return watched.filter((m) => m.watchDate?.startsWith(selectedYear));
  }, [movies, selectedYear]);

  // Calculations for wrapped stats
  const totalWatched = filteredWatched.length;
  const totalMinutes = filteredWatched.reduce((s, m) => s + (m.cached?.runtime ?? 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const daysContinuous = (totalMinutes / (60 * 24)).toFixed(1);

  // Top genres
  const genreStats = useMemo(() => {
    const map = new Map<string, number>();
    filteredWatched.forEach((m) => {
      (m.cached?.genres ?? []).forEach((g) => map.set(g, (map.get(g) ?? 0) + 1));
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percent: totalWatched ? Math.round((count / totalWatched) * 100) : 0,
      }));
  }, [filteredWatched, totalWatched]);

  const topGenre = genreStats[0]?.name || "Cinema Explorer";

  // Cinephile Persona Archetype
  const persona = useMemo(() => {
    const primary = topGenre.toLowerCase();
    if (primary.includes("drama")) return { title: "The Deep Soul", icon: "🍷", desc: "You seek emotion, character depth, and poignant human stories." };
    if (primary.includes("sci-fi") || primary.includes("science")) return { title: "The Cosmic Voyager", icon: "🚀", desc: "You dream beyond the stars, exploring alternate realities and futuristic wonders." };
    if (primary.includes("thriller") || primary.includes("mystery") || primary.includes("crime")) return { title: "The Mastermind Sleuth", icon: "🕵️", desc: "Plot twists, nail-biting suspense, and mind games are your bread and butter." };
    if (primary.includes("action") || primary.includes("adventure")) return { title: "The Adrenaline Seeker", icon: "⚡", desc: "High-octane spectacles and daring quests fuel your passion for movies." };
    if (primary.includes("horror")) return { title: "The Fearless Nightcrawler", icon: "🕯️", desc: "You brave the shadows and relish psychological chills and macabre thrills." };
    if (primary.includes("comedy") || primary.includes("animation")) return { title: "The Joy Bringer", icon: "🍿", desc: "Laughter, boundless imagination, and heart-warming charm define your watch history." };
    if (primary.includes("romance")) return { title: "The Hopeless Romantic", icon: "🌹", desc: "True love, heartbreak, and tender chemistry captivate your screen." };
    return { title: "The True Connoisseur", icon: "🎬", desc: "A versatile cinephile with an eclectic, world-class taste across all genres." };
  }, [topGenre]);

  // Top rated movie of the year
  const topMovie = useMemo(() => {
    const rated = [...filteredWatched]
      .filter((m) => m.personalRating != null)
      .sort((a, b) => (b.personalRating ?? 0) - (a.personalRating ?? 0));
    return rated[0] || filteredWatched[0];
  }, [filteredWatched]);

  // Average rating
  const avgRating = useMemo(() => {
    const rated = filteredWatched.filter((m) => m.personalRating != null);
    if (!rated.length) return 0;
    return (rated.reduce((s, m) => s + (m.personalRating ?? 0), 0) / rated.length).toFixed(1);
  }, [filteredWatched]);

  // Busiest month
  const peakMonth = useMemo(() => {
    const map = new Map<string, number>();
    filteredWatched.forEach((m) => {
      if (m.watchDate && m.watchDate.length >= 7) {
        const key = m.watchDate.slice(0, 7); // YYYY-MM
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    });
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return null;
    const [ym, count] = sorted[0];
    const date = new Date(`${ym}-01`);
    const monthName = isNaN(date.getTime()) ? ym : date.toLocaleString("default", { month: "long" });
    return { month: monthName, count };
  }, [filteredWatched]);

  const totalRewatches = filteredWatched.reduce((s, m) => s + (m.rewatchCount ?? 0), 0);

  const totalSlides = 5;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) setCurrentSlide((s) => s + 1);
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide((s) => s - 1);
  };

  const [copied, setCopied] = useState(false);
  const copyWrappedSummary = () => {
    const summary = `🎬 My CineJournal Wrapped (${selectedYear === "all" ? "All-Time" : selectedYear}):
📽️ ${totalWatched} Films Watched
⏱️ ${hours}h ${remainingMins}m of Cinema Time
🏆 Top Film: ${topMovie?.cached?.title || "None"} (${topMovie?.personalRating ?? 10}/10 ⭐)
🧬 Persona: ${persona.title} ${persona.icon}
🍿 Top Genre: ${topGenre}
⭐ Avg Rating: ${avgRating}/10
Track your cinematic journey on CineJournal!`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Wrapped summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const yearLabel = selectedYear === "all" ? "All-Time Journey" : `${selectedYear} in Film`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full sm:max-w-xl sm:w-[95vw] p-0 overflow-hidden bg-black border-y sm:border border-red-500/30 text-white shadow-2xl rounded-none sm:rounded-3xl">
        {/* Top Story Progress Bars */}
        <div className="absolute top-3 left-4 right-4 z-20 flex gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className="h-1 flex-1 rounded-full overflow-hidden bg-white/20 transition-all hover:bg-white/40 cursor-pointer"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  i < currentSlide
                    ? "bg-primary w-full"
                    : i === currentSlide
                    ? "bg-white w-full shadow-[0_0_8px_white]"
                    : "w-0"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Header with Year Selector & Close */}
        <div className="relative z-10 px-6 pt-7 pb-3 flex items-center justify-between border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              CineWrapped
            </span>
          </div>

          <div className="flex items-center gap-2 mr-6">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentSlide(0);
              }}
              className="rounded-lg bg-zinc-900 border border-white/15 px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y === "all" ? "All-Time" : y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Story Slide Area */}
        <div className="relative min-h-[460px] sm:min-h-[500px] flex flex-col justify-between p-6 sm:p-8 overflow-hidden bg-gradient-to-b from-zinc-950 via-black to-zinc-950">
          {/* Background Ambient Glow */}
          <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

          {/* Slide 0: The Big Numbers */}
          {currentSlide === 0 && (
            <div className="my-auto flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-3.5 py-1 text-xs font-bold text-red-400 mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                {yearLabel}
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                You went deep into cinema.
              </h2>
              <p className="text-sm text-zinc-400 mt-1 max-w-sm">
                Here is your screening milestone and total hours spent in film.
              </p>

              <div className="my-8 flex flex-col items-center">
                <div className="font-display text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300 drop-shadow-xl tracking-tight">
                  {totalWatched}
                </div>
                <span className="text-sm font-semibold tracking-wider uppercase text-zinc-400 mt-1">
                  Films Watched
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                <div className="glass-card rounded-2xl p-3.5 border border-white/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-semibold">Total Watch Time</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {hours}h {remainingMins}m
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-3.5 border border-white/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <Film className="h-4 w-4" />
                    <span className="text-xs font-semibold">Equivalent To</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {daysContinuous} Full Days
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Slide 1: Cinema DNA & Persona */}
          {currentSlide === 1 && (
            <div className="my-auto flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3.5 py-1 text-xs font-bold text-zinc-300 mb-3">
                Cinematic DNA
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Your Movie Archetype
              </h2>

              <div className="my-6 p-6 rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/10 via-zinc-900/60 to-black w-full max-w-sm shadow-2xl">
                <div className="text-5xl sm:text-6xl mb-3">{persona.icon}</div>
                <h3 className="text-xl sm:text-2xl font-black text-white">{persona.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
                  {persona.desc}
                </p>
              </div>

              {/* Genre breakdown */}
              <div className="w-full max-w-sm space-y-2 text-left">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Top Genres
                </span>
                {genreStats.slice(0, 3).map((g) => (
                  <div key={g.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-white">{g.name}</span>
                      <span className="text-zinc-400">{g.count} films ({g.percent}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(10, g.percent))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slide 2: Film of the Year (Top Rated) */}
          {currentSlide === 2 && (
            <div className="my-auto flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-400 mb-3">
                <Trophy className="h-3.5 w-3.5" />
                Film of the Year
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Your Highest Rated Masterpiece
              </h2>

              {topMovie ? (
                <div className="my-6 flex flex-col items-center w-full max-w-sm">
                  <div className="relative aspect-[2/3] w-36 sm:w-44 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-amber-400/30 bg-zinc-900 group">
                    {topMovie.cached?.poster ? (
                      <img
                        src={topMovie.cached.poster}
                        alt={topMovie.cached.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground p-3">
                        {topMovie.cached?.title}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 rounded-lg bg-black/80 px-2 py-0.5 text-xs font-black text-amber-400 backdrop-blur-md flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {topMovie.personalRating ?? 10}/10
                    </div>
                  </div>

                  <h3 className="mt-3 text-lg sm:text-xl font-black text-white">
                    {topMovie.cached?.title}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {topMovie.cached?.year} • {topMovie.cached?.genres?.slice(0, 2).join(", ")}
                  </span>

                  {topMovie.notes ? (
                    <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs italic text-zinc-300 line-clamp-2 max-w-xs">
                      "{topMovie.notes}"
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="py-12 text-zinc-400 text-sm">
                  Log ratings on your watched movies to highlight your top film here!
                </div>
              )}
            </div>
          )}

          {/* Slide 3: Habits & Peak Season */}
          {currentSlide === 3 && (
            <div className="my-auto flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3.5 py-1 text-xs font-bold text-zinc-300 mb-3">
                Viewing Habits
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                How You Watched
              </h2>

              <div className="my-8 grid grid-cols-2 gap-3.5 w-full max-w-sm">
                <div className="glass-card rounded-2xl p-4 border border-white/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                    <Star className="h-4 w-4 fill-amber-400" />
                    <span className="text-xs font-semibold">Average Rating</span>
                  </div>
                  <div className="text-3xl font-black text-white">{avgRating}</div>
                  <span className="text-[11px] text-zinc-400">out of 10 stars</span>
                </div>

                <div className="glass-card rounded-2xl p-4 border border-white/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                    <RotateCcw className="h-4 w-4" />
                    <span className="text-xs font-semibold">Rewatches</span>
                  </div>
                  <div className="text-3xl font-black text-white">{totalRewatches}</div>
                  <span className="text-[11px] text-zinc-400">re-screenings logged</span>
                </div>

                {peakMonth ? (
                  <div className="col-span-2 glass-card rounded-2xl p-4 border border-white/10 text-center">
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-semibold">Peak Movie Season</span>
                    </div>
                    <div className="text-2xl font-black text-white">{peakMonth.month}</div>
                    <span className="text-xs text-zinc-400">
                      Your biggest cinema month with {peakMonth.count} films watched!
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Slide 4: Grand Summary Ticket Card */}
          {currentSlide === 4 && (
            <div className="my-auto flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-3.5 py-1 text-xs font-bold text-red-400 mb-3">
                <Share2 className="h-3.5 w-3.5" />
                Your Official CineWrapped Card
              </span>

              {/* The Styled Ticket Card */}
              <div className="my-4 p-5 rounded-3xl border-2 border-red-500/40 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 w-full max-w-xs shadow-2xl text-left relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Film className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black tracking-wider uppercase text-white">
                      CineJournal
                    </span>
                  </div>
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-black text-primary border border-primary/30">
                    {selectedYear === "all" ? "ALL-TIME" : selectedYear}
                  </span>
                </div>

                <div className="py-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                      Persona
                    </span>
                    <div className="text-base font-black text-white flex items-center gap-1.5">
                      <span>{persona.icon}</span>
                      <span>{persona.title}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        Films
                      </span>
                      <span className="text-lg font-black text-white">{totalWatched}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        Hours
                      </span>
                      <span className="text-lg font-black text-white">{hours}h</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                      Top Genre
                    </span>
                    <span className="text-sm font-bold text-amber-400">{topGenre}</span>
                  </div>

                  {topMovie && (
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        Top Film
                      </span>
                      <span className="text-xs font-bold text-white truncate block">
                        {topMovie.cached?.title} ({topMovie.personalRating ?? 10}/10 ★)
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>#CINEWRAPPED</span>
                  <span>cinejournal.app</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={copyWrappedSummary}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {copied ? "Copied!" : "Share Summary"}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentSlide(0)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-all"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Replay
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls at Bottom */}
          <div className="relative z-10 pt-4 flex items-center justify-between border-t border-white/10">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                currentSlide === 0
                  ? "opacity-30 cursor-not-allowed text-zinc-500"
                  : "text-zinc-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="text-xs text-zinc-500 font-medium">
              {currentSlide + 1} / {totalSlides}
            </span>

            {currentSlide < totalSlides - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 text-xs font-bold px-4 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-1 text-xs font-bold px-4 py-1.5 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-all"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
