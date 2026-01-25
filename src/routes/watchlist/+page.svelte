<script lang="ts">
  import MediaCard from "$lib/components/MediaCard.svelte";
  import { watchlistStore } from "$lib/stores/watchlist";

  $: items = $watchlistStore;
  $: sortedItems = [...items].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-3xl font-bold">Watchlist</h1>
    <span class="text-sm text-gray-400">{sortedItems.length} items</span>
  </div>

  {#if sortedItems.length === 0}
    <div class="bg-gray-800/60 border border-gray-700 rounded-lg p-8 text-center text-gray-300">
      Your watchlist is empty.
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {#each sortedItems as item (item.id + item.type)}
        <MediaCard
          id={item.id}
          type={item.type}
          title={item.title}
          posterPath={item.posterPath}
          voteAverage={item.voteAverage}
        />
      {/each}
    </div>
  {/if}
</div>
