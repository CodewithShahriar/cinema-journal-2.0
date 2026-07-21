import { createServerFn } from "@tanstack/react-start";
import type { TmdbMovie, TmdbSearchResult } from "./tmdb-types";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

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
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) throw new Error("TMDB not configured");
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`TMDB request failed: ${res.status}`);
  return (await res.json()) as T;
}

export const tmdbSearch = createServerFn({ method: "GET" })
  .inputValidator((d: { query: string }) => ({
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
  .inputValidator((d: { id: number }) => ({ id: Number(d?.id) }))
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
