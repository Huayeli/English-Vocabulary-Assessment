import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    exclude: ["dist/**", "**/node_modules/**"],
    testTimeout: 30000
  }
});
