import { defineConfig } from 'vitest/config';

// Kept apart from vite.config.ts so tests never run its postbuild hook,
// which restarts zebar.exe.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
