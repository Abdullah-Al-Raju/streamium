<script lang="ts">
  import { onMount } from 'svelte';
  import MediaCard from '$lib/components/MediaCard.svelte';
  import Hero from '$lib/components/Hero.svelte';
  import type { TMDBMediaResponse } from '$lib/types/tmdb';

  let trendingMovies: TMDBMediaResponse[] = [];
  let trendingShows: TMDBMediaResponse[] = [];
  let featuredMedia: TMDBMediaResponse | null = null;
  let featuredType: 'movie' | 'tv' = 'movie';
  let loading = true;
  let error: string | null = null;

  async function fetchTrending() {
    try {
      const [moviesRes, showsRes] = await Promise.all([
        fetch('/api/movies?sort=trending'),
        fetch('/api/tv?sort=trending')
      ]);

      const movies = await moviesRes.json();
      const shows = await showsRes.json();

      // Check for API errors
      if (movies.error || shows.error) {
        error = movies.error || shows.error;
        trendingMovies = [];
        trendingShows = [];
        return;
      }

      trendingMovies = movies.results.slice(0, 6);
      trendingShows = shows.results.slice(0, 6);

      const allMedia = [...movies.results, ...shows.results];
      if (allMedia.length > 0) {
        const randomIndex = Math.floor(Math.random() * allMedia.length);
        featuredMedia = allMedia[randomIndex];
        featuredType = featuredMedia && 'title' in featuredMedia ? 'movie' : 'tv';
      }
    } catch (err) {
      console.error('Error fetching trending content:', err);
      error = 'Failed to load trending content. Please try again later.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchTrending();
  });
</script>

{#if featuredMedia}
  <Hero media={featuredMedia} type={featuredType} />
{/if}

<div class="container mx-auto px-4 py-8 space-y-12">
  <section>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Trending Movies</h2>
      <a
        href="/movies?sort=trending"
        class="text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1"
      >
        Show All
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>

    {#if loading}
      <div class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    {:else if error}
      <div class="bg-yellow-900/30 border border-yellow-700 rounded-lg p-6 text-center">
        <svg class="w-12 h-12 mx-auto mb-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-yellow-200 mb-2">{error}</p>
        <p class="text-gray-400 text-sm">Get a free API key at <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener" class="text-primary-400 hover:underline">themoviedb.org</a></p>
      </div>
    {:else if trendingMovies.length === 0}
      <div class="text-gray-400 text-center py-8">
        No trending movies available
      </div>
    {:else}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {#each trendingMovies as movie (movie.id)}
          <MediaCard
            id={movie.id}
            type="movie"
            title={movie.title || ''}
            posterPath={movie.poster_path}
            voteAverage={movie.vote_average}
          />
        {/each}
      </div>
    {/if}
  </section>

  <section>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Trending TV Shows</h2>
      <a
        href="/tv?sort=trending"
        class="text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1"
      >
        Show All
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>

    {#if loading}
      <div class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    {:else if error}
      <!-- Error already shown above -->
    {:else if trendingShows.length === 0}
      <div class="text-gray-400 text-center py-8">
        No trending TV shows available
      </div>
    {:else}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {#each trendingShows as show (show.id)}
          <MediaCard
            id={show.id}
            type="tv"
            title={show.name || ''}
            posterPath={show.poster_path}
            voteAverage={show.vote_average}
          />
        {/each}
      </div>
    {/if}
  </section>
</div>
