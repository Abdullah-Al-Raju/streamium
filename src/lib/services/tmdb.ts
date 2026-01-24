import { TMDB_API_KEY } from '$env/static/private';
import type { TMDBMovie, TMDBTVShow, TMDBResponse, TMDBGenre, TMDBMediaResponse } from '$lib/types/tmdb';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const MAX_RETRIES = 2;

export class TMDBApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isAuthError: boolean = false
  ) {
    super(message);
    this.name = 'TMDBApiError';
  }
}

export class TMDBService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = TMDB_API_KEY || '';
    this.baseUrl = TMDB_BASE_URL;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  private async fetch<T>(endpoint: string, params: Record<string, any> = {}, retryCount = 0): Promise<T> {
    if (!this.isConfigured()) {
      throw new TMDBApiError(
        'TMDB API key is not configured. Please add TMDB_API_KEY to your .env file.',
        401,
        true
      );
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('api_key', this.apiKey);

    if (!params['vote_average.gte']) {
      params['vote_average.gte'] = 0.1;
    }

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    }

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 401) {
          throw new TMDBApiError(
            'Invalid TMDB API key. Please check your TMDB_API_KEY in .env file.',
            401,
            true
          );
        }

        if (response.status >= 400 && response.status < 500) {
          throw new TMDBApiError(
            `TMDB API client error: ${response.status} ${response.statusText}`,
            response.status
          );
        }

        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return this.fetch<T>(endpoint, params, retryCount + 1);
        }

        throw new TMDBApiError(
          `TMDB API error: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();

      if (data.results) {
        data.results = data.results.filter((item: any) => item.vote_average > 0);
      }

      return data;
    } catch (error) {
      if (error instanceof TMDBApiError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new TMDBApiError(error.message, 500);
      }
      throw new TMDBApiError('Failed to fetch from TMDB API', 500);
    }
  }

  async getMovieDetails(id: number): Promise<TMDBMovie> {
    return this.fetch<TMDBMovie>(`/movie/${id}`, {
      append_to_response: 'videos'
    });
  }

  async getTVShowDetails(id: number): Promise<TMDBTVShow> {
    return this.fetch<TMDBTVShow>(`/tv/${id}`, {
      append_to_response: 'videos'
    });
  }

  async getMovieGenres(): Promise<TMDBGenre[]> {
    const response = await this.fetch<{ genres: TMDBGenre[] }>('/genre/movie/list');
    return response.genres;
  }

  async getTVGenres(): Promise<TMDBGenre[]> {
    const response = await this.fetch<{ genres: TMDBGenre[] }>('/genre/tv/list');
    return response.genres;
  }

  async searchMovies(query: string, page = 1): Promise<TMDBResponse<TMDBMovie>> {
    return this.fetch<TMDBResponse<TMDBMovie>>('/search/movie', {
      query,
      page,
      include_adult: false,
      language: 'en-US'
    });
  }

  async searchTVShows(query: string, page = 1): Promise<TMDBResponse<TMDBTVShow>> {
    return this.fetch<TMDBResponse<TMDBTVShow>>('/search/tv', {
      query,
      page,
      include_adult: false,
      language: 'en-US'
    });
  }

  async searchMulti(query: string, page = 1): Promise<TMDBResponse<TMDBMediaResponse>> {
    return this.fetch<TMDBResponse<TMDBMediaResponse>>('/search/multi', {
      query,
      page,
      include_adult: false,
      language: 'en-US'
    });
  }

  async discoverMovies(params: Record<string, any> = {}): Promise<TMDBResponse<TMDBMovie>> {
    return this.fetch<TMDBResponse<TMDBMovie>>('/discover/movie', {
      include_adult: false,
      language: 'en-US',
      ...params
    });
  }

  async discoverTVShows(params: Record<string, any> = {}): Promise<TMDBResponse<TMDBTVShow>> {
    return this.fetch<TMDBResponse<TMDBTVShow>>('/discover/tv', {
      include_adult: false,
      language: 'en-US',
      ...params
    });
  }

  async getTrending(mediaType: 'movie' | 'tv', timeWindow: 'day' | 'week' = 'week'): Promise<TMDBResponse<TMDBMediaResponse>> {
    return this.fetch<TMDBResponse<TMDBMediaResponse>>(`/trending/${mediaType}/${timeWindow}`);
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<TMDBResponse<TMDBMovie>> {
    return this.fetch<TMDBResponse<TMDBMovie>>(`/trending/movie/${timeWindow}`);
  }

  async getTrendingTVShows(timeWindow: 'day' | 'week' = 'week'): Promise<TMDBResponse<TMDBTVShow>> {
    return this.fetch<TMDBResponse<TMDBTVShow>>(`/trending/tv/${timeWindow}`);
  }

  async getPopularMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
    return this.fetch<TMDBResponse<TMDBMovie>>('/movie/popular', { page });
  }

  async getPopularTVShows(page = 1): Promise<TMDBResponse<TMDBTVShow>> {
    return this.fetch<TMDBResponse<TMDBTVShow>>('/tv/popular', { page });
  }

  async getTopRatedMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
    return this.fetch<TMDBResponse<TMDBMovie>>('/movie/top_rated', { page });
  }

  async getTopRatedTVShows(page = 1): Promise<TMDBResponse<TMDBTVShow>> {
    return this.fetch<TMDBResponse<TMDBTVShow>>('/tv/top_rated', { page });
  }

  async getUpcomingMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
    return this.fetch<TMDBResponse<TMDBMovie>>('/movie/upcoming', { page });
  }

  async getOnTheAirTVShows(page = 1): Promise<TMDBResponse<TMDBTVShow>> {
    return this.fetch<TMDBResponse<TMDBTVShow>>('/tv/on_the_air', { page });
  }

  getImageUrl(path: string | null, size: 'original' | 'w500' | 'w780' = 'w500'): string | null {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
}
