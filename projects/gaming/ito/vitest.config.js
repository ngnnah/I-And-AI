import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.test.js',
        'js/main.js',
        'js/screens/**',
        'js/game/firebase-config.js',
        'js/game/firebase-sync.js'
      ]
    }
  }
});
