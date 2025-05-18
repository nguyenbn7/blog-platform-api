import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig({
  test: {
    passWithNoTests: true,
    globals: true,
    include: ["./tests/**/*.test.ts"],
    env: loadEnv("testing", process.cwd(), ""),
    globalSetup: "./tests/setup.ts",
  },
});
