import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ifc-viewer',
  server: {
    open: true,
  },
  assetsInclude: ['**/*.wasm'],
});
