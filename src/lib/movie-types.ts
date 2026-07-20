export type MovieStatus = "watchlist" | "watched";

export interface Movie {
  id: string;
  title: string;
  year?: number;
  genres: string[];
  runtime?: number;
  poster?: string;
  description?: string;
  note?: string;
  status: MovieStatus;
  rating?: number; // 0-10
  favorite: boolean;
  watchDate?: string; // ISO
  createdAt: string;
  updatedAt: string;
}

export const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "Horror", "Mystery", "Romance",
  "Sci-Fi", "Thriller", "War", "Western", "Musical", "Biography",
];
