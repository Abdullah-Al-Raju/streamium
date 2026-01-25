<script lang="ts">
  import { csrfFetch } from "$lib/utils/csrf";

  export let data: {
    desktop: boolean;
    config: {
      TMDB_API_KEY: string;
      TMDB_API_URL: string;
      TMDB_IMAGE_URL: string;
      VIDSRC_BASE_URL: string;
      VIDLINK_BASE_URL: string;
      MOVIES111_BASE_URL: string;
      EMBED2_BASE_URL: string;
      DATABASE_URL: string;
    } | null;
  };

  let form = {
    TMDB_API_KEY: data.config?.TMDB_API_KEY ?? "",
    TMDB_API_URL: data.config?.TMDB_API_URL ?? "",
    TMDB_IMAGE_URL: data.config?.TMDB_IMAGE_URL ?? "",
    VIDSRC_BASE_URL: data.config?.VIDSRC_BASE_URL ?? "",
    VIDLINK_BASE_URL: data.config?.VIDLINK_BASE_URL ?? "",
    MOVIES111_BASE_URL: data.config?.MOVIES111_BASE_URL ?? "",
    EMBED2_BASE_URL: data.config?.EMBED2_BASE_URL ?? "",
    DATABASE_URL: data.config?.DATABASE_URL ?? "",
  };

  let saving = false;
  let error = "";
  let success = "";
  let restartRequired = false;

  async function saveSettings() {
    saving = true;
    error = "";
    success = "";
    restartRequired = false;

    try {
      const response = await csrfFetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to save settings");
      }

      const payload = await response.json();
      form = { ...payload.config };
      restartRequired = Boolean(payload.restartRequired);
      success = "Settings saved.";
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to save settings";
    } finally {
      saving = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-10 max-w-3xl">
  <h1 class="text-3xl font-bold mb-6">Desktop Settings</h1>

  {#if !data.desktop}
    <div class="bg-gray-800/60 border border-gray-700 rounded-lg p-6 text-gray-300">
      Settings are available only in the desktop app.
    </div>
  {:else}
    {#if error}
      <div class="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}

    {#if success}
      <div class="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded mb-4">
        {success}
        {#if restartRequired}
          <div class="mt-2 text-sm text-green-300">
            Restart the app to apply database changes.
          </div>
        {/if}
      </div>
    {/if}

    <form class="space-y-8" on:submit|preventDefault={saveSettings}>
      <section class="bg-gray-800/60 border border-gray-700 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">TMDB</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-300 mb-2">TMDB API Key</label>
            <input class="w-full input" bind:value={form.TMDB_API_KEY} placeholder="TMDB API Key" />
          </div>
          <div>
            <label class="block text-sm text-gray-300 mb-2">TMDB API URL</label>
            <input class="w-full input" bind:value={form.TMDB_API_URL} />
          </div>
          <div>
            <label class="block text-sm text-gray-300 mb-2">TMDB Image URL</label>
            <input class="w-full input" bind:value={form.TMDB_IMAGE_URL} />
          </div>
        </div>
      </section>

      <section class="bg-gray-800/60 border border-gray-700 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Providers</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-300 mb-2">VIDSRC Base URL</label>
            <input class="w-full input" bind:value={form.VIDSRC_BASE_URL} />
          </div>
          <div>
            <label class="block text-sm text-gray-300 mb-2">VidLink Base URL</label>
            <input class="w-full input" bind:value={form.VIDLINK_BASE_URL} />
          </div>
          <div>
            <label class="block text-sm text-gray-300 mb-2">111Movies Base URL</label>
            <input class="w-full input" bind:value={form.MOVIES111_BASE_URL} />
          </div>
          <div>
            <label class="block text-sm text-gray-300 mb-2">2Embed Base URL</label>
            <input class="w-full input" bind:value={form.EMBED2_BASE_URL} />
          </div>
        </div>
      </section>

      <section class="bg-gray-800/60 border border-gray-700 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Database</h2>
        <div>
          <label class="block text-sm text-gray-300 mb-2">SQLite Database URL</label>
          <input class="w-full input" bind:value={form.DATABASE_URL} />
          <p class="text-sm text-gray-400 mt-2">
            Changing this requires an app restart and should point to a local file.
          </p>
        </div>
      </section>

      <div class="flex justify-end">
        <button
          type="submit"
          class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  {/if}
</div>
