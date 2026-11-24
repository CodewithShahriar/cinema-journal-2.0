import type { User } from "@supabase/supabase-js";
import type { TrackedMovie } from "./movie-types";
import { supabase } from "./supabase";

type MovieRow = {
  id: string;
  tmdb_id?: number;
  payload: TrackedMovie & { deleted?: boolean; deletedAt?: string };
  updated_at?: string;
  user_id?: string;
};

export interface CloudSyncData {
  activeMovies: TrackedMovie[];
  deletedIds: Set<string>;
  deletedTmdbIds: Set<number>;
}

/**
 * Retrieves the current authenticated or existing session user.
 * Will not throw or crash if anonymous auth is disabled or network fails.
 */
export async function getSupabaseUser(): Promise<User | null> {
  if (!supabase) return null;

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (!sessionError && sessionData.session?.user) {
      return sessionData.session.user;
    }
  } catch (err) {
    console.warn("Could not read Supabase session:", err);
  }

  // If not logged in, attempt anonymous sign in if enabled on Supabase project
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data?.user) {
      return data.user;
    }
  } catch {
    // Anonymous sign in not enabled or blocked - completely fine, local storage will persist
  }

  return null;
}

export async function loadMoviesFromSupabase(): Promise<CloudSyncData> {
  if (!supabase) {
    return { activeMovies: [], deletedIds: new Set(), deletedTmdbIds: new Set() };
  }

  try {
    const { data, error } = await supabase
      .from("movies")
      .select("id, tmdb_id, payload, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("Error loading movies from Supabase:", error);
      throw error;
    }

    const activeMovies: TrackedMovie[] = [];
    const deletedIds = new Set<string>();
    const deletedTmdbIds = new Set<number>();

    for (const row of (data ?? []) as MovieRow[]) {
      const payload = row.payload;
      if (!payload) continue;

      if (payload.deleted === true) {
        if (payload.id) deletedIds.add(payload.id);
        if (row.id) deletedIds.add(row.id);
        if (payload.tmdbId) deletedTmdbIds.add(payload.tmdbId);
        if (row.tmdb_id) deletedTmdbIds.add(row.tmdb_id);
      } else if (payload.id) {
        activeMovies.push(payload as TrackedMovie);
      }
    }

    return { activeMovies, deletedIds, deletedTmdbIds };
  } catch (err) {
    console.warn("Failed to fetch cloud movies:", err);
    throw err;
  }
}

export async function saveMovieToSupabase(movie: TrackedMovie, userId?: string): Promise<void> {
  if (!supabase) return;

  const row: Record<string, unknown> = {
    id: movie.id,
    tmdb_id: movie.tmdbId,
    payload: movie,
    updated_at: movie.updatedAt || new Date().toISOString(),
  };

  if (userId) {
    row.user_id = userId;
  }

  const { error } = await supabase.from("movies").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

export async function saveMoviesToSupabase(movies: TrackedMovie[], userId?: string): Promise<void> {
  if (!supabase || movies.length === 0) return;

  // Batch into chunks of 50 for speed and network reliability
  const chunkSize = 50;
  for (let i = 0; i < movies.length; i += chunkSize) {
    const chunk = movies.slice(i, i + chunkSize);
    const rows = chunk.map((movie) => {
      const row: Record<string, unknown> = {
        id: movie.id,
        tmdb_id: movie.tmdbId,
        payload: movie,
        updated_at: movie.updatedAt || new Date().toISOString(),
      };
      if (userId) row.user_id = userId;
      return row;
    });

    const { error } = await supabase.from("movies").upsert(rows, { onConflict: "id" });
    if (error) {
      console.warn("Error batch saving movies to Supabase:", error);
      throw error;
    }
  }
}

export async function deleteMovieFromSupabase(
  id: string,
  tmdbId?: number,
  userId?: string,
): Promise<void> {
  if (!supabase) return;

  const now = new Date().toISOString();

  try {
    // 1. Delete active movie rows matching either id or tmdb_id
    if (tmdbId) {
      await supabase.from("movies").delete().or(`id.eq.${id},tmdb_id.eq.${tmdbId}`);
    } else {
      await supabase.from("movies").delete().eq("id", id);
    }

    // 2. Upsert a persistent tombstone so other devices know this movie was deleted
    const tombstoneId = tmdbId ? `tombstone_${tmdbId}` : `tombstone_${id}`;
    const tombstoneRow: Record<string, unknown> = {
      id: tombstoneId,
      tmdb_id: tmdbId ?? 0,
      payload: {
        id,
        tmdbId,
        deleted: true,
        deletedAt: now,
      },
      updated_at: now,
    };
    if (userId) tombstoneRow.user_id = userId;

    await supabase.from("movies").upsert(tombstoneRow, { onConflict: "id" });
  } catch (err) {
    console.warn("Error deleting movie from Supabase:", err);
    throw err;
  }
}

export async function clearTombstoneInSupabase(tmdbId: number): Promise<void> {
  if (!supabase || !tmdbId) return;
  try {
    await supabase.from("movies").delete().eq("id", `tombstone_${tmdbId}`);
  } catch {
    // Non-critical cleanup
  }
}
