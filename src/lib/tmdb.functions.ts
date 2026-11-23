import { createServerFn } from "@tanstack/react-start";
import type { TmdbMovie, TmdbSearchResult } from "./tmdb-types";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

// Fallback read token to ensure search is never blocked
const DEFAULT_TMDB_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzZDc0ZTI5YzI2MTI0MzFiM2JmODRjYzQ5MTkwMGZkZCIsIm5iZiI6MTc4NDY1NDYzMC43ODEsInN1YiI6IjZhNWZhYjI2MWJiZmJiMjg0YmFmN2VlNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.an31Jfqdkj-73RXexyXZHRhJFYbCpo1U-5bHDudzGVw";

function getTmdbToken(): string {
  const token =
    process.env.TMDB_READ_TOKEN ||
    process.env.VITE_TMDB_READ_TOKEN ||
    (import.meta as unknown as { env?: Record<string, string> }).env?.TMDB_READ_TOKEN ||
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_TMDB_READ_TOKEN ||
    DEFAULT_TMDB_TOKEN;

  return (token || "").trim();
}

function posterUrl(path?: string | null, size = "w342") {
  return path ? `${IMG}/${size}${path}` : undefined;
}

function backdropUrl(path?: string | null, size = "w1280") {
  return path ? `${IMG}/${size}${path}` : undefined;
}

function yearFromDate(d?: string | null): number | undefined {
  const y = d?.slice(0, 4);
  return y && /^\d{4}$/.test(y) ? Number(y) : undefined;
}

async function tmdb<T>(path: string): Promise<T> {
  const token = getTmdbToken();
  if (!token) throw new Error("TMDB token not configured");

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(`TMDB request failed (${res.status}): ${errorBody || res.statusText}`);
  }

  return (await res.json()) as T;
}

export const tmdbSearch = createServerFn({ method: "GET" })
  .validator((d: { query: string }) => ({
    query: String(d?.query ?? "").slice(0, 200),
  }))
  .handler(async ({ data }): Promise<TmdbSearchResult[]> => {
    const q = data.query.trim();
    if (!q) return [];

    const json = await tmdb<{ results: Array<Record<string, unknown>> }>(
      `/search/movie?include_adult=false&language=en-US&page=1&query=${encodeURIComponent(q)}`,
    );

    return (json.results ?? []).slice(0, 20).map((r) => ({
      id: r.id as number,
      title: (r.title as string) || (r.original_title as string) || "Untitled",
      year: yearFromDate(r.release_date as string | undefined),
      poster: posterUrl(r.poster_path as string | undefined),
      overview: (r.overview as string) || undefined,
      voteAverage: typeof r.vote_average === "number" ? (r.vote_average as number) : undefined,
      genreIds: (r.genre_ids as number[]) ?? [],
    }));
  });

export const tmdbGetMovie = createServerFn({ method: "GET" })
  .validator((d: { id: number }) => ({ id: Number(d?.id) }))
  .handler(async ({ data }): Promise<TmdbMovie> => {
    const r = await tmdb<Record<string, unknown>>(`/movie/${data.id}?language=en-US`);
    return {
      id: r.id as number,
      title: (r.title as string) || (r.original_title as string) || "Untitled",
      originalTitle: (r.original_title as string) || undefined,
      year: yearFromDate(r.release_date as string | undefined),
      releaseDate: (r.release_date as string) || undefined,
      genres: ((r.genres as Array<{ name: string }>) ?? []).map((g) => g.name),
      runtime: typeof r.runtime === "number" ? (r.runtime as number) : undefined,
      poster: posterUrl(r.poster_path as string | undefined, "w500"),
      backdrop: backdropUrl(r.backdrop_path as string | undefined),
      overview: (r.overview as string) || undefined,
      voteAverage: typeof r.vote_average === "number" ? (r.vote_average as number) : undefined,
      voteCount: typeof r.vote_count === "number" ? (r.vote_count as number) : undefined,
    };
  });
