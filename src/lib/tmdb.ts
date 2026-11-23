import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { tmdbGetMovie, tmdbSearch } from "./tmdb.functions";
import { useMovies } from "./movies-store";
import type { TmdbMovie, TmdbSearchResult } from "./tmdb-types";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const DEFAULT_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzZDc0ZTI5YzI2MTI0MzFiM2JmODRjYzQ5MTkwMGZkZCIsIm5iZiI6MTc4NDY1NDYzMC43ODEsInN1YiI6IjZhNWZhYjI2MWJiZmJiMjg0YmFmN2VlNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.an31Jfqdkj-73RXexyXZHRhJFYbCpo1U-5bHDudzGVw";

function getClientToken(): string {
  const token =
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_TMDB_READ_TOKEN ||
    (import.meta as unknown as { env?: Record<string, string> }).env?.TMDB_READ_TOKEN ||
    DEFAULT_TOKEN;
  return (token || "").trim();
}

/** Direct client-side fetch fallback when server function is unreachable */
async function directClientSearch(query: string): Promise<TmdbSearchResult[]> {
  const token = getClientToken();
  const res = await fetch(
    `${BASE}/search/movie?include_adult=false&language=en-US&page=1&query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );
  if (!res.ok) throw new Error(`TMDB direct search failed: ${res.status}`);
  const json = (await res.json()) as { results?: Array<Record<string, unknown>> };

  return (json.results ?? []).slice(0, 20).map((r) => {
    const releaseDate = r.release_date as string | undefined;
    const year = releaseDate && /^\d{4}/.test(releaseDate) ? Number(releaseDate.slice(0, 4)) : undefined;
    const posterPath = r.poster_path as string | undefined;
    return {
      id: r.id as number,
      title: (r.title as string) || (r.original_title as string) || "Untitled",
      year,
      poster: posterPath ? `${IMG}/w342${posterPath}` : undefined,
      overview: (r.overview as string) || undefined,
      voteAverage: typeof r.vote_average === "number" ? r.vote_average : undefined,
      genreIds: (r.genre_ids as number[]) ?? [],
    };
  });
}

/** Direct client-side fetch fallback for movie details */
async function directClientGetMovie(id: number): Promise<TmdbMovie> {
  const token = getClientToken();
  const res = await fetch(`${BASE}/movie/${id}?language=en-US`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`TMDB direct get movie failed: ${res.status}`);
  const r = (await res.json()) as Record<string, unknown>;

  const releaseDate = r.release_date as string | undefined;
  const year = releaseDate && /^\d{4}/.test(releaseDate) ? Number(releaseDate.slice(0, 4)) : undefined;
  const posterPath = r.poster_path as string | undefined;
  const backdropPath = r.backdrop_path as string | undefined;

  return {
    id: r.id as number,
    title: (r.title as string) || (r.original_title as string) || "Untitled",
    originalTitle: (r.original_title as string) || undefined,
    year,
    releaseDate,
    genres: ((r.genres as Array<{ name: string }>) ?? []).map((g) => g.name),
    runtime: typeof r.runtime === "number" ? (r.runtime as number) : undefined,
    poster: posterPath ? `${IMG}/w500${posterPath}` : undefined,
    backdrop: backdropPath ? `${IMG}/w1280${backdropPath}` : undefined,
    overview: (r.overview as string) || undefined,
    voteAverage: typeof r.vote_average === "number" ? (r.vote_average as number) : undefined,
    voteCount: typeof r.vote_count === "number" ? (r.vote_count as number) : undefined,
  };
}

/** Fetch fresh TMDB details for a movie, falling back to cached snapshot or direct client fetch */
export function useTmdbMovie(tmdbId: number, fallback?: TmdbMovie) {
  const fetcher = useServerFn(tmdbGetMovie);
  const { updateCached } = useMovies();

  const q = useQuery({
    queryKey: ["tmdb-movie", tmdbId],
    queryFn: async () => {
      try {
        return await fetcher({ data: { id: tmdbId } });
      } catch (serverErr) {
        console.warn("ServerFn failed for TMDB movie; attempting direct client fetch:", serverErr);
        return await directClientGetMovie(tmdbId);
      }
    },
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

/** Debounced TMDB search with automatic server and client failover */
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
    queryFn: async () => {
      try {
        return await fetcher({ data: { query: trimmed } });
      } catch (serverErr) {
        console.warn("ServerFn failed for TMDB search; attempting direct client fetch:", serverErr);
        return await directClientSearch(trimmed);
      }
    },
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

/** For pages that show lists, cached snapshot is used for filtering/sorting */
export function useVisibleTitle(cached?: TmdbMovie) {
  return useMemo(() => cached?.title ?? "Loading…", [cached]);
}
