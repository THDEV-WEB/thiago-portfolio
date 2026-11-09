import { defineConfig } from "vitest/config";

// Testes do levantamento AWP (tests/awp-levantamento). Não afetam o build do site.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
