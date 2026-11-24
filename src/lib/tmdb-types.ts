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
  tagline?: string;
  budget?: number;
  revenue?: number;
  originalLanguage?: string;
  productionCompanies?: string[];
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

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profilePath?: string;
  order: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profilePath?: string;
}

export interface TmdbCredits {
  cast: TmdbCastMember[];
  directors: TmdbCrewMember[];
}

export interface TmdbRecommendation {
  id: number;
  title: string;
  poster?: string;
  backdrop?: string;
  year?: number;
  voteAverage?: number;
  overview?: string;
  genreIds?: number[];
}
