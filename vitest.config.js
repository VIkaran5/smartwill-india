import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['js/wizard/guards.js', 'js/wizard/fsm.js', 'js/wizard/stateAdapter.js'],
      thresholds: {
        statements: 90,
        branches: 70,
        functions: 85,
        lines: 95
      }
    }
  }
});
