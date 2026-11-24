import { createServerFn } from "@tanstack/react-start";
import type {
  TmdbMovie,
  TmdbSearchResult,
  TmdbVideo,
  TmdbCredits,
  TmdbRecommendation,
} from "./tmdb-types";

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
      tagline: (r.tagline as string) || undefined,
      budget: typeof r.budget === "number" && r.budget > 0 ? (r.budget as number) : undefined,
      revenue: typeof r.revenue === "number" && r.revenue > 0 ? (r.revenue as number) : undefined,
      originalLanguage: (r.original_language as string) || undefined,
      productionCompanies: ((r.production_companies as Array<{ name: string }>) ?? []).map((c) => c.name),
    };
  });

export const tmdbGetExtendedPlot = createServerFn({ method: "GET" })
  .validator((d: { title: string; year?: number }) => ({
    title: String(d?.title ?? ""),
    year: d?.year ? Number(d.year) : undefined,
  }))
  .handler(async ({ data }): Promise<{ plot?: string; summary?: string } | null> => {
    if (!data.title) return null;
    try {
      const cleanTitle = data.title.trim().replace(/ /g, "_");
      const tryFetch = async (queryName: string) => {
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&titles=${encodeURIComponent(queryName)}&format=json`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) return null;
        const json = (await res.json()) as { query?: { pages?: Record<string, { extract?: string }> } };
        const pages = json?.query?.pages ?? {};
        const pid = Object.keys(pages)[0];
        if (!pid || pid === "-1" || !pages[pid]?.extract) return null;
        return pages[pid].extract;
      };

      let text = await tryFetch(cleanTitle);
      if (!text || text.length < 100) {
        text = await tryFetch(`${cleanTitle}_(film)`);
      }
      if (!text && data.year) {
        text = await tryFetch(`${cleanTitle}_(${data.year}_film)`);
      }
      if (!text) return null;

      const plotMatch = text.match(/== Plot ==\n([\s\S]*?)(?=\n== )/);
      const plot = plotMatch ? plotMatch[1].trim() : undefined;
      // Get the intro section before the first heading
      const introMatch = text.split(/\n== /)[0]?.trim();

      return {
        plot,
        summary: introMatch || text.slice(0, 600).trim(),
      };
    } catch {
      return null;
    }
  });

export const tmdbGetVideos = createServerFn({ method: "GET" })
  .validator((d: { id: number }) => ({ id: Number(d?.id) }))
  .handler(async ({ data }): Promise<TmdbVideo[]> => {
    try {
      const json = await tmdb<{ results: Array<Record<string, unknown>> }>(
        `/movie/${data.id}/videos?language=en-US`,
      );
      return (json.results ?? []).map((v) => ({
        id: String(v.id),
        key: String(v.key),
        name: String(v.name || ""),
        site: String(v.site || ""),
        type: String(v.type || ""),
        official: Boolean(v.official),
      }));
    } catch {
      return [];
    }
  });

function profileUrl(path?: string | null, size = "w185") {
  return path ? `${IMG}/${size}${path}` : undefined;
}

export const tmdbGetCredits = createServerFn({ method: "GET" })
  .validator((d: { id: number }) => ({ id: Number(d?.id) }))
  .handler(async ({ data }): Promise<TmdbCredits> => {
    try {
      const json = await tmdb<{
        cast?: Array<Record<string, unknown>>;
        crew?: Array<Record<string, unknown>>;
      }>(`/movie/${data.id}/credits?language=en-US`);

      const cast = (json.cast ?? []).slice(0, 12).map((c) => ({
        id: c.id as number,
        name: (c.name as string) || "Unknown",
        character: (c.character as string) || "",
        profilePath: profileUrl(c.profile_path as string | undefined),
        order: (c.order as number) ?? 0,
      }));

      const directors = (json.crew ?? [])
        .filter((c) => c.job === "Director")
        .map((c) => ({
          id: c.id as number,
          name: (c.name as string) || "Unknown",
          job: "Director",
          department: (c.department as string) || "Directing",
          profilePath: profileUrl(c.profile_path as string | undefined),
        }));

      return { cast, directors };
    } catch {
      return { cast: [], directors: [] };
    }
  });

export const tmdbGetRecommendations = createServerFn({ method: "GET" })
  .validator((d: { id: number }) => ({ id: Number(d?.id) }))
  .handler(async ({ data }): Promise<TmdbRecommendation[]> => {
    try {
      let json = await tmdb<{ results?: Array<Record<string, unknown>> }>(
        `/movie/${data.id}/recommendations?language=en-US&page=1`,
      );

      // Fallback to similar movies if recommendations are sparse
      if (!json.results || json.results.length < 3) {
        json = await tmdb<{ results?: Array<Record<string, unknown>> }>(
          `/movie/${data.id}/similar?language=en-US&page=1`,
        );
      }

      return (json.results ?? []).slice(0, 12).map((r) => ({
        id: r.id as number,
        title: (r.title as string) || (r.original_title as string) || "Untitled",
        year: yearFromDate(r.release_date as string | undefined),
        poster: posterUrl(r.poster_path as string | undefined, "w342"),
        backdrop: backdropUrl(r.backdrop_path as string | undefined),
        overview: (r.overview as string) || undefined,
        voteAverage:
          typeof r.vote_average === "number"
            ? Number((r.vote_average as number).toFixed(1))
            : undefined,
        genreIds: (r.genre_ids as number[]) ?? [],
      }));
    } catch {
      return [];
    }
  });
