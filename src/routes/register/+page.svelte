<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import Captcha from '$lib/components/Captcha.svelte';

  let username = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let error = '';
  let captchaVerified = false;

  function validatePassword(pass: string): string | null {
    if (pass.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(pass)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pass)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pass)) {
      return 'Password must contain at least one number';
    }
    return null;
  }

  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function handleCaptchaVerify(event: CustomEvent<{ valid: boolean; captchaId: string; answer: string }>) {
    captchaVerified = event.detail.valid;
    if (!captchaVerified) {
      error = 'Invalid captcha, please try again';
    } else {
      error = '';
    }
  }

  async function handleSubmit() {
    error = '';


    if (!username || !password || !confirmPassword) {
      error = 'Please fill in all required fields';
      return;
    }


    if (username.length < 3) {
      error = 'Username must be at least 3 characters long';
      return;
    }


    if (email && !validateEmail(email)) {
      error = 'Please enter a valid email address';
      return;
    }


    const passwordError = validatePassword(password);
    if (passwordError) {
      error = passwordError;
      return;
    }


    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }


    if (!captchaVerified) {
      error = 'Please complete the captcha verification';
      return;
    }

    loading = true;

    try {
      const success = await authStore.register(username, email || null, password);
      if (success) {
        goto('/');
      } else {
        error = 'Registration failed. This username or email might already be taken.';
      }
    } catch (err) {
      console.error('Registration error:', err);
      error = 'An error occurred during registration. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-[calc(100vh-16rem)] flex items-center justify-center px-4">
  <div class="w-full max-w-md">
    <div class="bg-gray-800 rounded-lg shadow-xl p-8">
      <h1 class="text-3xl font-bold text-center mb-8">Create Account</h1>

      <form on:submit|preventDefault={handleSubmit} class="space-y-6" autocomplete="off">
        {#if error}
          <div class="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
            {error}
          </div>
        {/if}

        <div>
          <label for="username" class="block text-sm font-medium text-gray-300 mb-2">
            Username <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="username"
            bind:value={username}
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            minlength="3"
            autocomplete="off"
          />
          <p class="mt-1 text-sm text-gray-400">Must be at least 3 characters long</p>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
            Email <span class="text-gray-500">(optional)</span>
          </label>
          <input
            type="email"
            id="email"
            bind:value={email}
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autocomplete="off"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
            Password <span class="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            bind:value={password}
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            minlength="8"
            autocomplete="new-password"
          />
          <p class="mt-1 text-sm text-gray-400">
            Must be at least 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        <div>
          <label for="confirm-password" class="block text-sm font-medium text-gray-300 mb-2">
            Confirm Password <span class="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="confirm-password"
            bind:value={confirmPassword}
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            autocomplete="new-password"
          />
        </div>

        <div>
          <Captcha on:verify={handleCaptchaVerify} />
        </div>

        <button
          type="submit"
          class="w-full py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <div class="text-center text-sm text-gray-400">
          Already have an account?
          <a href="/login" class="text-primary-400 hover:text-primary-300">
            Login
          </a>
        </div>
      </form>
    </div>
  </div>
</div>
