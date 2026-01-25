import { browser } from "$app/environment";
import { writable, get } from "svelte/store";

export type WatchlistItem = {
  id: number;
  type: "movie" | "tv";
  title: string;
  posterPath: string | null;
  voteAverage: number;
  addedAt: number;
};

const STORAGE_KEY = "streamium_watchlist";

function normalize(items: unknown): WatchlistItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item): item is WatchlistItem => {
      if (!item || typeof item !== "object") return false;
      const entry = item as WatchlistItem;
      return (
        typeof entry.id === "number" &&
        (entry.type === "movie" || entry.type === "tv") &&
        typeof entry.title === "string" &&
        typeof entry.voteAverage === "number"
      );
    })
    .map((item) => ({
      ...item,
      posterPath: item.posterPath ?? null,
      addedAt: typeof item.addedAt === "number" ? item.addedAt : Date.now(),
    }));
}

function loadFromStorage(): WatchlistItem[] {
  if (!browser) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalize(JSON.parse(raw));
  } catch {
    return [];
  }
}

const store = writable<WatchlistItem[]>([]);
const { subscribe, set, update } = store;

if (browser) {
  set(loadFromStorage());
  subscribe((items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  });
}

function isSameItem(item: WatchlistItem, id: number, type: "movie" | "tv") {
  return item.id === id && item.type === type;
}

function add(item: Omit<WatchlistItem, "addedAt">) {
  update((items) => {
    if (items.some((entry) => isSameItem(entry, item.id, item.type))) {
      return items;
    }
    const next = [{ ...item, addedAt: Date.now() }, ...items];
    return next;
  });
}

function remove(id: number, type: "movie" | "tv") {
  update((items) => items.filter((item) => !isSameItem(item, id, type)));
}

function toggle(item: Omit<WatchlistItem, "addedAt">) {
  const items = get(store);
  if (items.some((entry) => isSameItem(entry, item.id, item.type))) {
    remove(item.id, item.type);
    return;
  }
  add(item);
}

function isInWatchlist(id: number, type: "movie" | "tv") {
  return get(store).some((item) => isSameItem(item, id, type));
}

export const watchlistStore = {
  subscribe,
  add,
  remove,
  toggle,
  isInWatchlist,
  set,
};
