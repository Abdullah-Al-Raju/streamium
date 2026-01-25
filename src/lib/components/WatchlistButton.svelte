<script lang="ts">
  import { watchlistStore } from "$lib/stores/watchlist";
  import { toastStore } from "$lib/stores/toast";

  export let id: number;
  export let type: "movie" | "tv";
  export let title: string;
  export let posterPath: string | null;
  export let voteAverage: number;

  $: isInWatchlist = $watchlistStore.some(
    (item) => item.id === id && item.type === type,
  );

  function toggleWatchlist(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    if (isInWatchlist) {
      watchlistStore.remove(id, type);
      toastStore.info("Removed from watchlist");
    } else {
      watchlistStore.add({ id, type, title, posterPath, voteAverage });
      toastStore.success("Added to watchlist");
    }
  }
</script>

<button
  type="button"
  class="flex items-center justify-center w-9 h-9 rounded-full bg-black/70 text-white hover:bg-black/80 transition-colors"
  aria-pressed={isInWatchlist}
  aria-label={isInWatchlist ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`}
  on:click={toggleWatchlist}
>
  <svg
    class="w-5 h-5"
    fill={isInWatchlist ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
    />
  </svg>
</button>
