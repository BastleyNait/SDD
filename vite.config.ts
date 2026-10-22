import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './', // rutas relativas: el build funciona servido desde cualquier carpeta
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/main.ts', 'src/vite-env.d.ts', 'src/types/**'],
      reporter: ['text', 'html'],
    },
  },
});
