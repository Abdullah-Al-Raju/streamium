import adapter from "@sveltejs/adapter-node";
import { preprocessMeltUI } from "@melt-ui/pp";
import sequence from "svelte-sequential-preprocessor";
import preprocess from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      out: 'build',
      precompress: true,
      envPrefix: '',
      polyfill: true,
      external: [],
    }),
    csrf: {
      checkOrigin: true,
    },
  },
  preprocess: sequence([
    preprocess({
      postcss: true,
    }),
    preprocessMeltUI(),
  ]),
};

export default config;
