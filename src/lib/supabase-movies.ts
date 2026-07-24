import type { User } from "@supabase/supabase-js";
import type { TrackedMovie } from "./movie-types";
import { supabase } from "./supabase";

type MovieRow = {
  id: string;
  payload: TrackedMovie;
};

/** Creates a private anonymous account the first time a visitor uses the app. */
export async function getSupabaseUser(): Promise<User | null> {
  if (!supabase) return null;

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session?.user) return sessionData.session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}

export async function loadMoviesFromSupabase(): Promise<TrackedMovie[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("movies")
    .select("id, payload")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as MovieRow[])
    .map((row) => row.payload)
    .filter((movie): movie is TrackedMovie => Boolean(movie?.id));
}

export async function saveMovieToSupabase(movie: TrackedMovie): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("movies").upsert(
    {
      id: movie.id,
      tmdb_id: movie.tmdbId,
      payload: movie,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function saveMoviesToSupabase(movies: TrackedMovie[]): Promise<void> {
  await Promise.all(movies.map(saveMovieToSupabase));
}

export async function deleteMovieFromSupabase(id: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("movies").delete().eq("id", id);
  if (error) throw error;
}
