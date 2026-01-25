<script lang="ts">
  import VideoPlayer from '$lib/components/VideoPlayer.svelte';
  import EpisodeSelector from '$lib/components/EpisodeSelector.svelte';
  import NextEpisode from '$lib/components/NextEpisode.svelte';
  import WatchlistButton from '$lib/components/WatchlistButton.svelte';
  import { providers, getDefaultProvider } from '$lib/services/providers';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  interface PageData {
    media: {
      id: number;
      title?: string;
      name?: string;
      backdrop_path?: string;
      poster_path?: string | null;
      release_date?: string;
      first_air_date?: string;
      runtime?: number;
      vote_average: number;
      overview: string;
      genres?: Array<{ id: number; name: string }>;
      number_of_seasons?: number;
      number_of_episodes?: number;
    };
    type: 'movie' | 'tv';
    season?: number;
    episode?: number;
  }

  export let data: PageData;
  $: media = data.media;
  $: mediaType = data.type;
  $: selectedSeason = data.season;
  $: selectedEpisode = data.episode;
  let showEpisodeModal = false;
  let videoPlayer: VideoPlayer;
  let selectedProviderId = getDefaultProvider().id;

  $: seasonCount = mediaType === 'tv' ? media?.number_of_seasons : 0;
  $: episodeCount = mediaType === 'tv' ? media?.number_of_episodes : 0;

  function handleEpisodeSelect(event: CustomEvent<{ season: number; episode: number }>) {
    const { season, episode } = event.detail;
    const url = new URL($page.url);
    url.searchParams.set('season', season.toString());
    url.searchParams.set('episode', episode.toString());
    goto(url.toString(), { replaceState: true });
  }

  function handleNextEpisode(season: number, episode: number) {
    const url = new URL($page.url);
    url.searchParams.set('season', season.toString());
    url.searchParams.set('episode', episode.toString());
    goto(url.toString(), { replaceState: true });
  }

  function handleProviderChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    selectedProviderId = select.value;
    videoPlayer?.changeProvider(select.value);
  }

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<div class="min-h-screen bg-gray-900">
  <div class="relative">
    {#if media?.backdrop_path}
      <div class="absolute inset-0 h-[50vh]">
        <img
          src={`/api/image/original${media.backdrop_path}`}
          alt={media.title || media.name || ''}
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-gray-900/80 to-gray-900"></div>
      </div>
    {/if}

    <div class="relative container mx-auto px-4 pt-4 lg:pt-[20vh]">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Right Column: Content (Moved up for mobile) -->
        <div class="w-full lg:w-3/4 lg:order-2">
          <div class="bg-gray-800 rounded-lg overflow-hidden">
            <!-- Source Selection -->
            <div class="p-4 bg-gray-900 flex justify-between items-center">
              <select
                class="bg-gray-800 text-white px-3 py-1 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                bind:value={selectedProviderId}
                on:change={handleProviderChange}
                aria-label="Select video provider"
              >
                {#each providers as provider}
                  <option value={provider.id}>{provider.name}</option>
                {/each}
              </select>
              <div class="ml-2">
                <WatchlistButton
                  id={media.id}
                  type={mediaType}
                  title={media.title || media.name || ''}
                  posterPath={media.poster_path || null}
                  voteAverage={media.vote_average}
                />
              </div>
            </div>

            <!-- Video Player -->
            <div class="aspect-video">
              <VideoPlayer
                bind:this={videoPlayer}
                mediaId={media.id}
                {mediaType}
                title={media.title || media.name || ''}
                season={selectedSeason}
                episode={selectedEpisode}
              />
            </div>

            <div class="p-6">
              <div class="flex items-start justify-between gap-4 mb-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 bg-primary-500 text-xs font-medium rounded-full">
                      {mediaType === 'tv' ? 'TV Series' : 'Movie'}
                    </span>
                    {#if mediaType === 'tv'}
                      <span class="text-sm text-gray-400">
                        {seasonCount} {seasonCount === 1 ? 'Season' : 'Seasons'} • {episodeCount} {episodeCount === 1 ? 'Episode' : 'Episodes'}
                      </span>
                    {/if}
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <h1 class="text-3xl font-bold">{media.title || media.name}</h1>
                    <div class="flex items-center gap-2">
                      {#if mediaType === 'tv'}
                        <button
                          type="button"
                          class="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
                          on:click={() => showEpisodeModal = true}
                        >
                          {selectedSeason && selectedEpisode
                            ? `S${selectedSeason}E${selectedEpisode}`
                            : 'Select Episode'}
                        </button>

                        {#if selectedSeason && selectedEpisode}
                          <NextEpisode
                            mediaId={media.id}
                            currentSeason={selectedSeason}
                            currentEpisode={selectedEpisode}
                            onSelect={handleNextEpisode}
                          />
                        {/if}
                      {/if}
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-4 text-sm text-gray-400 mb-6">
                <span>{formatDate(media.release_date || media.first_air_date)}</span>
                {#if media.runtime}
                  <span>•</span>
                  <span>{media.runtime} min</span>
                {/if}
                <span>•</span>
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{media.vote_average.toFixed(1)}</span>
                </div>
              </div>

              <p class="text-gray-300 mb-6">{media.overview}</p>

              {#if media.genres?.length}
                <div class="flex flex-wrap gap-2">
                  {#each media.genres as genre}
                    <span class="px-3 py-1 bg-gray-700 rounded-full text-sm">
                      {genre.name}
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

        </div>

        <!-- Left Column: Poster -->
        <div class="w-full lg:w-1/4 lg:order-1">
          <div class="lg:sticky lg:top-24">
            <div class="hidden lg:block aspect-[2/3] rounded-lg overflow-hidden shadow-xl">
              <img
                src={media.poster_path ? `/api/image/w500${media.poster_path}` : '/placeholder-poster.jpg'}
                alt={media.title || media.name || ''}
                class="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<EpisodeSelector
  mediaId={media.id}
  bind:showModal={showEpisodeModal}
  on:select={handleEpisodeSelect}
/>
