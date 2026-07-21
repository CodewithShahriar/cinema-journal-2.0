export interface TmdbMovie {
  id: number;
  title: string;
  originalTitle?: string;
  year?: number;
  releaseDate?: string;
  genres: string[];
  runtime?: number;
  poster?: string;
  backdrop?: string;
  overview?: string;
  voteAverage?: number;
  voteCount?: number;
}

export interface TmdbSearchResult {
  id: number;
  title: string;
  year?: number;
  poster?: string;
  overview?: string;
  voteAverage?: number;
  genreIds: number[];
}
