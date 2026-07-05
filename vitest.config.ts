import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "_archive-og", "**/*.e2e.*"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "hooks/**/*.{ts,tsx}"],
      exclude: ["**/*.test.*", "**/*.spec.*", "lib/**/*.json"],
    },
  },
});
