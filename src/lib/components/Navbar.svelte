<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let isScrolled = false;
  let isMobileMenuOpen = false;

  onMount(() => {
    const handleScroll = () => {
      isScrolled = window.scrollY > 0;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/movies', label: 'Movies' },
    { href: '/tv', label: 'TV Shows' },
    { href: '/watchlist', label: 'Watchlist' }
  ];
</script>

<nav
  class="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
  class:bg-gray-900={isScrolled}
  class:backdrop-blur={isScrolled}
>
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2">
        <span class="text-2xl font-bold text-primary-400">Streamium</span>
      </a>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center gap-6">
        {#each navItems as item}
          <a
            href={item.href}
            class="text-gray-300 hover:text-white transition-colors"
            class:text-primary-400={$page.url.pathname === item.href}
          >
            {item.label}
          </a>
        {/each}
        {#if $page.data.desktop}
          <a
            href="/settings"
            class="text-gray-300 hover:text-white transition-colors"
            class:text-primary-400={$page.url.pathname === '/settings'}
          >
            Settings
          </a>
        {/if}
      </div>

      <!-- Search and User Menu -->
      <div class="flex items-center gap-4">
        <a
          href="/search"
          class="p-2 text-gray-300 hover:text-white transition-colors"
          aria-label="Search"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </a>

        <!-- Mobile Menu Button -->
        <button
          type="button"
          class="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
          on:click={() => isMobileMenuOpen = !isMobileMenuOpen}
          aria-label="Toggle mobile menu"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {#if isMobileMenuOpen}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            {/if}
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    {#if isMobileMenuOpen}
      <div class="md:hidden py-4 space-y-2">
        {#each navItems as item}
          <a
            href={item.href}
            class="block px-4 py-2 text-gray-300 hover:text-white transition-colors"
            class:text-primary-400={$page.url.pathname === item.href}
            on:click={() => isMobileMenuOpen = false}
          >
            {item.label}
          </a>
        {/each}

        {#if $page.data.desktop}
          <a
            href="/settings"
            class="block px-4 py-2 text-gray-300 hover:text-white transition-colors"
            class:text-primary-400={$page.url.pathname === '/settings'}
            on:click={() => isMobileMenuOpen = false}
          >
            Settings
          </a>
        {/if}
      </div>
    {/if}
  </div>
</nav>

<!-- Spacer to prevent content from being hidden under fixed navbar -->
<div class="h-16"></div>
