<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';

  export let required = true;

  const dispatch = createEventDispatcher<{ verify: { valid: boolean; captchaId: string; answer: string } }>();

  let captchaId = '';
  let captchaText = '';
  let userInput = '';
  let canvas: HTMLCanvasElement;
  let loading = false;
  let verified = false;

  async function fetchCaptcha() {
    loading = true;
    verified = false;
    userInput = '';

    try {
      const response = await fetch('/api/captcha');
      if (!response.ok) {
        throw new Error('Failed to fetch captcha');
      }
      const data = await response.json();
      captchaId = data.id;
      captchaText = data.text;
      renderCaptcha();
    } catch (error) {
      console.error('Error fetching captcha:', error);
    } finally {
      loading = false;
    }
  }

  function renderCaptcha() {
    const ctx = canvas?.getContext('2d');
    if (!ctx || !captchaText) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, 0,
      canvas.width/2, canvas.height/2, canvas.width/2
    );
    gradient.addColorStop(0, '#1a1e2d');
    gradient.addColorStop(0.5, '#1f2937');
    gradient.addColorStop(1, '#1a1e2d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const startY = Math.random() * canvas.height;
      const endY = Math.random() * canvas.height;
      const controlY = Math.random() * canvas.height;

      ctx.moveTo(0, startY);
      ctx.quadraticCurveTo(
        canvas.width/2, controlY,
        canvas.width, endY
      );

      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.1)`;
      ctx.lineWidth = 15;
      ctx.stroke();
    }

    for (let i = 0; i < 150; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 2,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.fill();
    }

    const chars_array = captchaText.split('');
    const char_width = canvas.width / (chars_array.length + 1);

    chars_array.forEach((char, i) => {
      ctx.save();
      const x = char_width * (i + 0.8) + (Math.random() - 0.5) * 15;
      const y = canvas.height / 2 + (Math.random() - 0.5) * 20;

      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.8);

      const fonts = ['Arial Black', 'Impact', 'Verdana', 'Times New Roman'];
      const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
      const fontSize = Math.floor(Math.random() * 10) + 28;
      ctx.font = `bold ${fontSize}px ${randomFont}`;

      for (let j = 0; j < 2; j++) {
        ctx.shadowColor = `rgba(0, 0, 0, ${0.2 + Math.random() * 0.3})`;
        ctx.shadowBlur = 4 + Math.random() * 4;
        ctx.shadowOffsetX = (Math.random() - 0.5) * 6;
        ctx.shadowOffsetY = (Math.random() - 0.5) * 6;
        ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.3)`;
        ctx.fillText(char, 0, 0);
      }

      ctx.restore();
    });

    chars_array.forEach((char, i) => {
      ctx.save();
      const x = char_width * (i + 0.8) + (Math.random() - 0.5) * 15;
      const y = canvas.height / 2 + (Math.random() - 0.5) * 20;

      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.8);

      const fonts = ['Arial Black', 'Impact', 'Verdana', 'Times New Roman'];
      const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
      const fontSize = Math.floor(Math.random() * 10) + 28;
      ctx.font = `bold ${fontSize}px ${randomFont}`;

      const brightness = Math.random() * 100 + 120;
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;

      ctx.transform(1, Math.random() * 0.3 - 0.15, Math.random() * 0.3 - 0.15, 1, 0, 0);
      ctx.fillText(char, 0, 0);

      if (Math.random() > 0.5) {
        ctx.beginPath();
        ctx.moveTo(-fontSize/2, -fontSize/2);
        ctx.lineTo(fontSize/2, fontSize/2);
        ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
        ctx.lineWidth = 1 + Math.random();
        ctx.stroke();
      }

      ctx.restore();
    });

    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const startX = Math.random() * canvas.width;
      const startY = 0;
      const endX = Math.random() * canvas.width;
      const endY = canvas.height;

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.lineWidth = 1 + Math.random();
      ctx.stroke();
    }

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      let x = 0;
      let y = Math.random() * canvas.height;
      ctx.moveTo(x, y);

      while (x < canvas.width) {
        x += 10;
        y = y + Math.sin(x * 0.05) * 15;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  async function verifyCaptcha() {
    if (!userInput || !captchaId) {
      dispatch('verify', { valid: false, captchaId: '', answer: '' });
      return;
    }

    // Dispatch with data for server-side validation during form submission
    // We also do a preliminary server check here
    try {
      const response = await fetch('/api/captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: captchaId, answer: userInput }),
      });

      const result = await response.json();
      verified = result.valid;

      dispatch('verify', {
        valid: result.valid,
        captchaId,
        answer: userInput
      });

      if (!result.valid) {
        // Get a new captcha on failure
        await fetchCaptcha();
      }
    } catch {
      dispatch('verify', { valid: false, captchaId: '', answer: '' });
      await fetchCaptcha();
    }
  }

  onMount(fetchCaptcha);
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center gap-4">
    <canvas
      bind:this={canvas}
      width="200"
      height="60"
      class="border border-gray-600 rounded bg-gray-700"
      aria-label="CAPTCHA image"
    ></canvas>
    <button
      type="button"
      class="p-2 rounded hover:bg-gray-700 text-gray-300 disabled:opacity-50"
      on:click={fetchCaptcha}
      disabled={loading}
      aria-label="Generate new CAPTCHA"
    >
      {#if loading}
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      {:else}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      {/if}
    </button>
    {#if verified}
      <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    {/if}
  </div>

  <div class="flex flex-col gap-2">
    <label for="captcha-input" class="text-sm font-medium text-gray-300">
      Enter the text shown above
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
    <input
      id="captcha-input"
      type="text"
      bind:value={userInput}
      on:blur={verifyCaptcha}
      class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      class:border-green-500={verified}
      {required}
      disabled={loading}
      aria-required={required}
      aria-label="CAPTCHA verification input"
    />
  </div>
</div>
