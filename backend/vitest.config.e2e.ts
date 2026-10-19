import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Files share one test database; run them one at a time.
    fileParallelism: false,
    // Each file creates the test DB/app; the first run after docker starts is slow.
    hookTimeout: 30_000,
  },
});
