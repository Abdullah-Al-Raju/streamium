<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { providers, getDefaultProvider, type Provider } from '$lib/services/providers';

  export let mediaId: string | number;
  export let mediaType: 'movie' | 'tv';
  export let title: string;
  export let season: number | undefined = undefined;
  export let episode: number | undefined = undefined;

  let selectedProvider = getDefaultProvider();
  let iframe: HTMLIFrameElement;
  let loading = true;
  let error: string | null = null;
  let retryCount = 0;
  const MAX_RETRIES = providers.length;

  $: embedUrl = selectedProvider.getEmbedUrl(mediaId, mediaType, season, episode);
  $: if (iframe) {
    // Ensure no sandbox attribute is set (some providers refuse sandboxed iframes).
    iframe.removeAttribute('sandbox');
  }

  onMount(() => {
    if (browser) {
      window.addEventListener('message', handleProviderMessage);
    }
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('message', handleProviderMessage);
    }
  });

  function handleProviderMessage(event: MessageEvent) {
    if (event.data?.type === 'error') {
      handleError();
    }
  }

  export function changeProvider(providerId: string) {
    const newProvider = providers.find(p => p.id === providerId);
    if (newProvider) {
      selectedProvider = newProvider;
      localStorage.setItem('selectedProvider', newProvider.id);
      loading = true;
      error = null;
      retryCount = 0;
    }
  }

  function handleIframeLoad() {
    loading = false;
    retryCount = 0;
  }

  function handleError() {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      tryNextProvider();
    } else {
      loading = false;
      error = 'Failed to load video player after trying all providers. Please try again later.';
    }
  }

  function handleIframeError() {
    handleError();
  }

  function tryNextProvider() {
    const currentIndex = providers.indexOf(selectedProvider);
    const nextIndex = (currentIndex + 1) % providers.length;
    selectedProvider = providers[nextIndex];
    localStorage.setItem('selectedProvider', selectedProvider.id);
    loading = true;
    error = null;
  }
</script>

<div class="video-player-frame relative w-full bg-black rounded-lg overflow-hidden">
  {#if loading}
    <div class="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
    </div>
  {/if}

  <iframe
    bind:this={iframe}
    {title}
    src={embedUrl}
    class="absolute top-0 left-0 w-full h-full"
    frameborder="0"
    scrolling="no"
    allowfullscreen={true}
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
    loading="lazy"
    on:load={handleIframeLoad}
    on:error={handleIframeError}
  ></iframe>

  {#if error}
    <div class="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
      <div class="text-red-500 text-center p-4">
        <p class="mb-2">{error}</p>
        <button
          type="button"
          class="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
          on:click={() => {
            retryCount = 0;
            tryNextProvider();
          }}
        >
          Try Different Provider
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .video-player-frame {
    padding-top: 56.25%;
  }
</style>
