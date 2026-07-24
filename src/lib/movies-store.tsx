import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import type { TrackedMovie } from "./movie-types";
import type { TmdbMovie } from "./tmdb-types";
import {
  deleteMovieFromSupabase,
  getSupabaseUser,
  loadMoviesFromSupabase,
  saveMoviesToSupabase,
} from "./supabase-movies";
import { isSupabaseConfigured } from "./supabase";

const STORAGE_KEY = "cinejournal.movies.v2";

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
  const [cloudReady, setCloudReady] = useState(false);
  const syncedMovieIds = useRef<Set<string>>(new Set());

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

  // Prefer the user's cloud collection. On their first cloud visit, migrate
  // the existing browser collection so no previously saved movies are lost.
  useEffect(() => {
    if (!hydrated || !isSupabaseConfigured) return;
    let cancelled = false;

    const connect = async () => {
      try {
        const user = await getSupabaseUser();
        if (!user || cancelled) return;

        const cloudMovies = await loadMoviesFromSupabase();
        if (cancelled) return;

        if (cloudMovies.length) {
          syncedMovieIds.current = new Set(cloudMovies.map((movie) => movie.id));
          setMovies(cloudMovies);
        } else if (movies.length) {
          await saveMoviesToSupabase(movies);
          syncedMovieIds.current = new Set(movies.map((movie) => movie.id));
        }
        if (!cancelled) setCloudReady(true);
      } catch (error) {
        // Local storage remains the offline fallback if Supabase is unavailable.
        console.warn("Supabase sync is unavailable; using local storage.", error);
      }
    };

    void connect();
    return () => {
      cancelled = true;
    };
    // Run once after browser storage has been read. Cloud writes below handle changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (!cloudReady) return;

    const sync = async () => {
      try {
        const nextIds = new Set(movies.map((movie) => movie.id));
        const removedIds = [...syncedMovieIds.current].filter((id) => !nextIds.has(id));
        await saveMoviesToSupabase(movies);
        await Promise.all(removedIds.map(deleteMovieFromSupabase));
        syncedMovieIds.current = nextIds;
      } catch (error) {
        console.warn("Could not save movie changes to Supabase.", error);
      }
    };

    void sync();
  }, [movies, cloudReady]);

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
