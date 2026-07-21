import type { TmdbMovie } from "./tmdb-types";

export type MovieStatus = "watchlist" | "watched";

/** Only personal tracking data is persisted. All movie metadata comes from TMDB
 *  by `tmdbId`. `cached` holds the last-known TMDB payload so the app still
 *  works offline / when TMDB is unreachable. */
export interface TrackedMovie {
  id: string;
  tmdbId: number;
  status: MovieStatus;
  favorite: boolean;
  personalRating?: number;
  review?: string;
  notes?: string;
  watchDate?: string;
  rewatchCount: number;
  createdAt: string;
  updatedAt: string;
  cached?: TmdbMovie;
}

// Kept as a filter dropdown convenience — TMDB uses matching names.
export const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery",
  "Romance", "Science Fiction", "Thriller", "War", "Western",
];
