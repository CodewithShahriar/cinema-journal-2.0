import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { TrackedMovie } from "./movie-types";
import type { TmdbMovie } from "./tmdb-types";
import {
  deleteMovieFromSupabase,
  getSupabaseUser,
  loadMoviesFromSupabase,
  saveMoviesToSupabase,
} from "./supabase-movies";
import { supabase, isSupabaseConfigured } from "./supabase";

const STORAGE_KEY = "cinejournal.movies.v2";
const BACKUP_KEY = "cinejournal.movies.backup";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

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

interface MoviesContextType {
  movies: TrackedMovie[];
  hydrated: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  syncNow: () => Promise<void>;
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

const MoviesContext = createContext<MoviesContextType | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/**
 * Intelligent merger that unites local and cloud movie lists without losing any items.
 * If conflicts exist for the same movie ID or tmdbId, the most recently updated version wins.
 */
export function mergeMovieLists(local: TrackedMovie[], cloud: TrackedMovie[]): TrackedMovie[] {
  const map = new Map<string, TrackedMovie>();
  const tmdbMap = new Map<number, string>(); // tmdbId -> movie.id

  // 1. Populate all cloud movies
  for (const item of cloud) {
    if (!item?.id) continue;
    map.set(item.id, item);
    if (item.tmdbId) tmdbMap.set(item.tmdbId, item.id);
  }

  // 2. Safely merge local movies without dropping any
  for (const localMovie of local) {
    if (!localMovie?.id) continue;

    const existingId = map.has(localMovie.id) ? localMovie.id : tmdbMap.get(localMovie.tmdbId);

    if (!existingId) {
      // Local movie does not exist in cloud -> keep it!
      map.set(localMovie.id, localMovie);
      if (localMovie.tmdbId) tmdbMap.set(localMovie.tmdbId, localMovie.id);
    } else {
      const cloudMovie = map.get(existingId)!;
      const localTime = new Date(localMovie.updatedAt || localMovie.createdAt || 0).getTime();
      const cloudTime = new Date(cloudMovie.updatedAt || cloudMovie.createdAt || 0).getTime();

      // If local version has newer updates, prioritize local content
      if (localTime >= cloudTime) {
        map.set(existingId, {
          ...cloudMovie,
          ...localMovie,
          id: existingId,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return tB - tA;
  });
}

export function MoviesProvider({ children }: { children: ReactNode }) {
  const [movies, setMovies] = useState<TrackedMovie[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const syncedMovieIds = useRef<Set<string>>(new Set());
  const currentUserId = useRef<string | null>(null);
  const isSyncingRef = useRef(false);

  // 1. Initial hydration from primary localStorage, fallback to backup if corrupted
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMovies(parsed);
          setHydrated(true);
          return;
        }
      }

      // Check backup key if primary is empty or missing
      const backupRaw = localStorage.getItem(BACKUP_KEY);
      if (backupRaw) {
        const backupParsed = JSON.parse(backupRaw);
        if (Array.isArray(backupParsed) && backupParsed.length > 0) {
          setMovies(backupParsed);
          localStorage.setItem(STORAGE_KEY, backupRaw);
        }
      }
    } catch (e) {
      console.warn("Storage hydration error; attempting recovery", e);
    }
    setHydrated(true);
  }, []);

  // 2. Persist local changes instantly to storage and backup
  useEffect(() => {
    if (!hydrated) return;
    try {
      const serialized = JSON.stringify(movies);
      localStorage.setItem(STORAGE_KEY, serialized);
      if (movies.length > 0) {
        localStorage.setItem(BACKUP_KEY, serialized);
      }
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  }, [movies, hydrated]);

  // 3. Robust Cloud Sync Logic
  const performSync = useCallback(
    async (localList: TrackedMovie[]) => {
      if (!isSupabaseConfigured || isSyncingRef.current) return;
      isSyncingRef.current = true;
      setSyncStatus("syncing");

      try {
        const user = await getSupabaseUser();
        currentUserId.current = user?.id || null;

        if (!user) {
          setSyncStatus("offline");
          isSyncingRef.current = false;
          return;
        }

        const cloudMovies = await loadMoviesFromSupabase();

        // Intelligently merge local and cloud records
        const merged = mergeMovieLists(localList, cloudMovies);

        // Update local state if merged list differs
        const mergedIds = merged.map((m) => m.id).join(",");
        const localIds = localList.map((m) => m.id).join(",");
        if (mergedIds !== localIds || merged.length !== localList.length) {
          setMovies(merged);
        }

        // Save any un-synced items to cloud
        await saveMoviesToSupabase(merged, user.id);
        syncedMovieIds.current = new Set(merged.map((m) => m.id));

        setLastSyncedAt(new Date());
        setSyncStatus("synced");
      } catch (err) {
        console.warn("Sync failed; running in offline resilient mode:", err);
        setSyncStatus("offline");
      } finally {
        isSyncingRef.current = false;
      }
    },
    [],
  );

  // Sync on initial hydration
  useEffect(() => {
    if (!hydrated) return;
    void performSync(movies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Listen to Supabase Auth State changes (Login, Logout, Token Refresh)
  useEffect(() => {
    if (!supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        const newUserId = session?.user?.id || null;
        if (newUserId !== currentUserId.current) {
          currentUserId.current = newUserId;
          // Re-sync with the freshly authenticated user, merging existing local movies into their account!
          setMovies((currentMovies) => {
            void performSync(currentMovies);
            return currentMovies;
          });
        }
      } else if (event === "SIGNED_OUT") {
        currentUserId.current = null;
        setSyncStatus("offline");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [performSync]);

  // Auto-sync movie changes to cloud with debouncing
  useEffect(() => {
    if (!hydrated || !isSupabaseConfigured || syncStatus === "offline" && !currentUserId.current) {
      return;
    }

    const timer = setTimeout(() => {
      if (currentUserId.current) {
        void (async () => {
          try {
            setSyncStatus("syncing");
            await saveMoviesToSupabase(movies, currentUserId.current);
            syncedMovieIds.current = new Set(movies.map((m) => m.id));
            setLastSyncedAt(new Date());
            setSyncStatus("synced");
          } catch {
            setSyncStatus("offline");
          }
        })();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [movies, hydrated, syncStatus]);

  const syncNow = useCallback(async () => {
    await performSync(movies);
  }, [performSync, movies]);

  const hasTmdb = useCallback(
    (tmdbId: number) => movies.some((m) => m.tmdbId === tmdbId),
    [movies],
  );

  const addByTmdb: MoviesContextType["addByTmdb"] = useCallback((input) => {
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

  const updateMovie: MoviesContextType["updateMovie"] = useCallback((id, patch) => {
    setMovies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m)),
    );
  }, []);

  const deleteMovie: MoviesContextType["deleteMovie"] = useCallback((id) => {
    setMovies((prev) => {
      const next = prev.filter((m) => m.id !== id);
      syncedMovieIds.current.delete(id);
      void deleteMovieFromSupabase(id).catch((err) =>
        console.warn("Could not delete from Supabase:", err),
      );
      return next;
    });
  }, []);

  const toggleFavorite: MoviesContextType["toggleFavorite"] = useCallback((id) => {
    setMovies((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, favorite: !m.favorite, updatedAt: new Date().toISOString() } : m,
      ),
    );
  }, []);

  const markWatched: MoviesContextType["markWatched"] = useCallback((id, rating) => {
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

  const moveToWatchlist: MoviesContextType["moveToWatchlist"] = useCallback((id) => {
    setMovies((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: "watchlist", watchDate: undefined, updatedAt: new Date().toISOString() }
          : m,
      ),
    );
  }, []);

  const incrementRewatch: MoviesContextType["incrementRewatch"] = useCallback((id) => {
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

  const updateCached: MoviesContextType["updateCached"] = useCallback((tmdbId, cached) => {
    setMovies((prev) => {
      let changed = false;
      const next = prev.map((m) => {
        if (m.tmdbId !== tmdbId) return m;
        if (m.cached && JSON.stringify(m.cached) === JSON.stringify(cached)) return m;
        changed = true;
        return { ...m, cached };
      });
      return changed ? next : prev;
    });
  }, []);

  const replaceAll: MoviesContextType["replaceAll"] = useCallback((next) => {
    setMovies(next);
  }, []);

  const clearAll = useCallback(() => {
    // Preserve emergency backup just in case clearAll was called by accident
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(movies));
    } catch {
      // ignore
    }
    setMovies([]);
  }, [movies]);

  return (
    <MoviesContext.Provider
      value={{
        movies,
        hydrated,
        syncStatus,
        lastSyncedAt,
        syncNow,
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
