import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    exclude: ["**/node_modules/**", "**/e2e/**", "**/e2e-flags/**", "**/e2e-mobile/**", "**/.next/**", "**/.next-e2e-flags/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
