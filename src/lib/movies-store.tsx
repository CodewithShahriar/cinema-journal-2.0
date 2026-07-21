import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { TrackedMovie } from "./movie-types";
import type { TmdbMovie } from "./tmdb-types";

const STORAGE_KEY = "cinejournal.movies.v2";
const THEME_KEY = "cinejournal.theme";
const ACCENT_KEY = "cinejournal.accent";

export interface AddByTmdbInput {
  tmdbId: number;
  status: TrackedMovie["status"];
  favorite?: boolean;
  personalRating?: number;
  review?: string;
  notes?: string;
  watchDate?: string;
  cached?: TmdbMovie;
}

interface Ctx {
  movies: TrackedMovie[];
  hydrated: boolean;
  addByTmdb: (input: AddByTmdbInput) => { movie: TrackedMovie; duplicate: boolean };
  updateMovie: (id: string, patch: Partial<TrackedMovie>) => void;
  deleteMovie: (id: string) => void;
  toggleFavorite: (id: string) => void;
  markWatched: (id: string, rating?: number) => void;
  moveToWatchlist: (id: string) => void;
  incrementRewatch: (id: string) => void;
  updateCached: (tmdbId: number, cached: TmdbMovie) => void;
  hasTmdb: (tmdbId: number) => boolean;
  replaceAll: (movies: TrackedMovie[]) => void;
  clearAll: () => void;
}

const MoviesContext = createContext<Ctx | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function MoviesProvider({ children }: { children: ReactNode }) {
  const [movies, setMovies] = useState<TrackedMovie[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TrackedMovie[];
        if (Array.isArray(parsed)) setMovies(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
  }, [movies, hydrated]);

  const hasTmdb = useCallback(
    (tmdbId: number) => movies.some((m) => m.tmdbId === tmdbId),
    [movies],
  );

  const addByTmdb: Ctx["addByTmdb"] = useCallback((input) => {
    const now = new Date().toISOString();
    let duplicate = false;
    let result: TrackedMovie | null = null;
    setMovies((prev) => {
      const existing = prev.find((m) => m.tmdbId === input.tmdbId);
      if (existing) {
        duplicate = true;
        result = existing;
        return prev;
      }
      const movie: TrackedMovie = {
        id: uid(),
        tmdbId: input.tmdbId,
        status: input.status,
        favorite: input.favorite ?? false,
        personalRating: input.personalRating,
        review: input.review,
        notes: input.notes,
        watchDate: input.status === "watched" ? input.watchDate ?? now : undefined,
        rewatchCount: 0,
        createdAt: now,
        updatedAt: now,
        cached: input.cached,
      };
      result = movie;
      return [movie, ...prev];
    });
    return { movie: result as unknown as TrackedMovie, duplicate };
  }, []);

  const updateMovie: Ctx["updateMovie"] = useCallback((id, patch) => {
    setMovies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m)),
    );
  }, []);

  const deleteMovie: Ctx["deleteMovie"] = useCallback((id) => {
    setMovies((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const toggleFavorite: Ctx["toggleFavorite"] = useCallback((id) => {
    setMovies((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, favorite: !m.favorite, updatedAt: new Date().toISOString() } : m,
      ),
    );
  }, []);

  const markWatched: Ctx["markWatched"] = useCallback((id, rating) => {
    setMovies((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: "watched",
              watchDate: m.watchDate ?? new Date().toISOString(),
              personalRating: rating ?? m.personalRating,
              updatedAt: new Date().toISOString(),
            }
          : m,
      ),
    );
  }, []);

  const moveToWatchlist: Ctx["moveToWatchlist"] = useCallback((id) => {
    setMovies((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: "watchlist", watchDate: undefined, updatedAt: new Date().toISOString() }
          : m,
      ),
    );
  }, []);

  const incrementRewatch: Ctx["incrementRewatch"] = useCallback((id) => {
    setMovies((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              rewatchCount: (m.rewatchCount ?? 0) + 1,
              watchDate: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : m,
      ),
    );
  }, []);

  const updateCached: Ctx["updateCached"] = useCallback((tmdbId, cached) => {
    setMovies((prev) => {
      let changed = false;
      const next = prev.map((m) => {
        if (m.tmdbId !== tmdbId) return m;
        // Avoid needless writes / render loops.
        if (m.cached && JSON.stringify(m.cached) === JSON.stringify(cached)) return m;
        changed = true;
        return { ...m, cached };
      });
      return changed ? next : prev;
    });
  }, []);

  const replaceAll: Ctx["replaceAll"] = useCallback((next) => setMovies(next), []);
  const clearAll = useCallback(() => setMovies([]), []);

  return (
    <MoviesContext.Provider
      value={{
        movies,
        hydrated,
        addByTmdb,
        updateMovie,
        deleteMovie,
        toggleFavorite,
        markWatched,
        moveToWatchlist,
        incrementRewatch,
        updateCached,
        hasTmdb,
        replaceAll,
        clearAll,
      }}
    >
      {children}
    </MoviesContext.Provider>
  );
}

export function useMovies() {
  const ctx = useContext(MoviesContext);
  if (!ctx) throw new Error("useMovies must be used within MoviesProvider");
  return ctx;
}

// Theme helpers (unchanged)
export function loadTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(THEME_KEY) as "dark" | "light") || "dark";
}
export function saveTheme(t: "dark" | "light") {
  localStorage.setItem(THEME_KEY, t);
  document.documentElement.classList.toggle("light", t === "light");
}
export function loadAccent(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ACCENT_KEY) || "";
}
export function saveAccent(oklchValue: string) {
  localStorage.setItem(ACCENT_KEY, oklchValue);
  if (oklchValue) document.documentElement.style.setProperty("--primary", oklchValue);
  else document.documentElement.style.removeProperty("--primary");
}
