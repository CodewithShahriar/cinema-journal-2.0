import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { tmdbGetMovie, tmdbSearch } from "./tmdb.functions";
import { useMovies } from "./movies-store";
import type { TmdbMovie } from "./tmdb-types";

/** Fetch fresh TMDB details for a movie, falling back to the cached snapshot
 *  stored on the tracked movie when TMDB is unreachable. */
export function useTmdbMovie(tmdbId: number, fallback?: TmdbMovie) {
  const fetcher = useServerFn(tmdbGetMovie);
  const { updateCached } = useMovies();
  const q = useQuery({
    queryKey: ["tmdb-movie", tmdbId],
    queryFn: () => fetcher({ data: { id: tmdbId } }),
    staleTime: 1000 * 60 * 60, // 1h
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    enabled: Number.isFinite(tmdbId) && tmdbId > 0,
  });

  useEffect(() => {
    if (q.data) updateCached(tmdbId, q.data);
  }, [q.data, tmdbId, updateCached]);

  const data = q.data ?? fallback;
  return {
    data,
    isLoading: q.isLoading && !fallback,
    error: q.error as Error | null,
    isFallback: !q.data && !!fallback,
    isFresh: !!q.data,
  };
}

/** Debounced TMDB search. Returns [] until the query is at least 2 chars. */
export function useTmdbSearch(query: string) {
  const fetcher = useServerFn(tmdbSearch);
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const trimmed = debounced.trim();
  return useQuery({
    queryKey: ["tmdb-search", trimmed],
    queryFn: () => fetcher({ data: { query: trimmed } }),
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

/** For pages that show lists, only the cached snapshot (already in state) is
 *  used for filtering/sorting. This keeps the UI snappy and offline-safe. */
export function useVisibleTitle(cached?: TmdbMovie) {
  return useMemo(() => cached?.title ?? "Loading…", [cached]);
}
