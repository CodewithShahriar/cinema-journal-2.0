import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Movie } from "./movie-types";

const STORAGE_KEY = "cinejournal.movies.v1";
const THEME_KEY = "cinejournal.theme";
const ACCENT_KEY = "cinejournal.accent";

interface Ctx {
  movies: Movie[];
  hydrated: boolean;
  addMovie: (m: Omit<Movie, "id" | "createdAt" | "updatedAt">) => Movie;
  updateMovie: (id: string, patch: Partial<Movie>) => void;
  deleteMovie: (id: string) => void;
  toggleFavorite: (id: string) => void;
  markWatched: (id: string, rating?: number) => void;
  moveToWatchlist: (id: string) => void;
  replaceAll: (movies: Movie[]) => void;
  clearAll: () => void;
}

const MoviesContext = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function MoviesProvider({ children }: { children: ReactNode }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMovies(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
  }, [movies, hydrated]);

  const addMovie: Ctx["addMovie"] = useCallback((m) => {
    const now = new Date().toISOString();
    const movie: Movie = { ...m, id: uid(), createdAt: now, updatedAt: now };
    setMovies((prev) => [movie, ...prev]);
    return movie;
  }, []);

  const updateMovie: Ctx["updateMovie"] = useCallback((id, patch) => {
    setMovies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m)),
    );
  }, []);

  const deleteMovie: Ctx["deleteMovie"] = useCallback((id) => {
    setMovies((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const toggleFavorite: Ctx["toggleFavorite"] = useCallback((id) => {
    setMovies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, favorite: !m.favorite, updatedAt: new Date().toISOString() } : m)),
    );
  }, []);

  const markWatched: Ctx["markWatched"] = useCallback((id, rating) => {
    setMovies((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: "watched",
              watchDate: m.watchDate ?? new Date().toISOString(),
              rating: rating ?? m.rating,
              updatedAt: new Date().toISOString(),
            }
          : m,
      ),
    );
  }, []);

  const moveToWatchlist: Ctx["moveToWatchlist"] = useCallback((id) => {
    setMovies((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: "watchlist", watchDate: undefined, updatedAt: new Date().toISOString() }
          : m,
      ),
    );
  }, []);

  const replaceAll: Ctx["replaceAll"] = useCallback((next) => setMovies(next), []);
  const clearAll = useCallback(() => setMovies([]), []);

  return (
    <MoviesContext.Provider
      value={{
        movies,
        hydrated,
        addMovie,
        updateMovie,
        deleteMovie,
        toggleFavorite,
        markWatched,
        moveToWatchlist,
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

// Theme
export function loadTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(THEME_KEY) as "dark" | "light") || "dark";
}
export function saveTheme(t: "dark" | "light") {
  localStorage.setItem(THEME_KEY, t);
  document.documentElement.classList.toggle("light", t === "light");
}
export function loadAccent(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ACCENT_KEY) || "";
}
export function saveAccent(oklchValue: string) {
  localStorage.setItem(ACCENT_KEY, oklchValue);
  if (oklchValue) document.documentElement.style.setProperty("--primary", oklchValue);
  else document.documentElement.style.removeProperty("--primary");
}
