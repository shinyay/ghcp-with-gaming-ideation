import { defineConfig } from "vite";

export default defineConfig({
  root: "apps/demo-site",
  base: "./",
  build: {
    target: "es2022",
    outDir: "../../dist/demo-site",
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true
  }
});
