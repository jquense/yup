import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test-setup.mjs'],
    include: ['test/**/*.{js,ts}'],
    exclude: [
      'test/helpers.ts',
      'test/.eslintrc.js',
      'test/**/.eslintrc.js',
      'test/types/types.ts',
    ],
    globals: false,
    projects: [
      {
        extends: true,
        test: {
          name: 'async',
        },
        define: {
          'global.YUP_USE_SYNC': false,
        },
      },
      {
        extends: true,
        test: {
          name: 'sync',
        },
        define: {
          'global.YUP_USE_SYNC': true,
        },
      },
    ],
  },
});
