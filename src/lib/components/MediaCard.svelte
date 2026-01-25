<script lang="ts">
  import Image from './Image.svelte';
  import WatchlistButton from './WatchlistButton.svelte';
  import { getReleaseType } from '$lib/services/release-type';
  import { onMount } from 'svelte';

  export let id: number;
  export let type: 'movie' | 'tv';
  export let title: string;
  export let posterPath: string | null;
  export let voteAverage: number;

  let releaseType = 'Unknown Quality';
  let certification = '';
  let loading = true;

  $: href = `/media/${id}?type=${type}`;

  onMount(async () => {
    try {
      const releaseInfo = await getReleaseType(id, type);
      releaseType = releaseInfo.releaseType;
      certification = releaseInfo.certifications['US'] || '';
    } catch (error) {
      console.error('Error fetching release info:', error);
    } finally {
      loading = false;
    }
  });

</script>

<div class="group relative bg-gray-800 rounded-lg overflow-hidden transition-transform hover:scale-105">
  <a {href} class="block">
    <div class="aspect-[2/3] relative">
      <Image
        src={posterPath}
        alt={title}
        class_="w-full h-full"
        sizes="(min-width: 1280px) 16.666vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33.333vw, 50vw"
      />

      <!-- Rating Badge -->
      <div class="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded bg-black/80">
        <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span class="text-sm font-bold text-white">{voteAverage.toFixed(1)}</span>
      </div>

      {#if !loading && releaseType !== 'Unknown Quality'}
        <div class="absolute top-12 right-2 px-2 py-1 text-xs font-semibold rounded bg-primary-500 text-white">
          {releaseType}
        </div>
      {/if}

      {#if certification}
        <div class="absolute bottom-2 right-2 px-2 py-1 text-xs font-semibold rounded bg-gray-700 text-white">
          {certification}
        </div>
      {/if}

      <!-- Hover Overlay -->
      <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div class="text-white text-center p-4">
          <span class="text-lg font-bold line-clamp-2">{title}</span>
          <div class="mt-2">
            <span class="inline-block px-3 py-1 rounded-full bg-primary-500 text-sm">
              {type === 'movie' ? 'Movie' : 'TV Show'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </a>

  <div class="absolute top-2 right-2 z-10">
    <WatchlistButton {id} {type} {title} posterPath={posterPath} {voteAverage} />
  </div>

</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
