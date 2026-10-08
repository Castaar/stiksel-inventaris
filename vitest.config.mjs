import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.js'],
    // The first run downloads a MongoDB binary
    hookTimeout: 120000,
    testTimeout: 30000,
    fileParallelism: false,
  },
});
