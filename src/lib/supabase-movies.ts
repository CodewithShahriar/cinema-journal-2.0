import type { User } from "@supabase/supabase-js";
import type { TrackedMovie } from "./movie-types";
import { supabase } from "./supabase";

type MovieRow = {
  id: string;
  payload: TrackedMovie;
  updated_at?: string;
  user_id?: string;
};

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

export async function loadMoviesFromSupabase(): Promise<TrackedMovie[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("movies")
      .select("id, payload, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("Error loading movies from Supabase:", error);
      throw error;
    }

    return ((data ?? []) as MovieRow[])
      .map((row) => row.payload)
      .filter((movie): movie is TrackedMovie => Boolean(movie?.id));
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

export async function deleteMovieFromSupabase(id: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("movies").delete().eq("id", id);
  if (error) {
    console.warn("Error deleting movie from Supabase:", error);
    throw error;
  }
}
