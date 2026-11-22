import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

const entrypoint = fileURLToPath(new URL('./scripts/server.mjs', import.meta.url));
export default defineConfig({
  output: 'server',
  image: {service:{entrypoint:'astro/assets/services/noop'}},
  adapter: {
    name: 'node-municipal',
    hooks: {
      'astro:config:done': ({ setAdapter }) => setAdapter({
        name: 'node-municipal',
        entrypointResolution: 'auto',
        serverEntrypoint: entrypoint,
        supportedAstroFeatures: { staticOutput: 'stable', serverOutput: 'stable' },
      }),
    },
  },
  server: { host: '127.0.0.1', port: 4321 },
});
