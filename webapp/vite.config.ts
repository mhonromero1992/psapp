import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    target: "es2022",
    // three.js (~950 kB) sits in the lazy MedalScene chunk: it loads only for the live
    // medal on wide screens, so phones never fetch it. No manual chunks: a manual "three"
    // chunk once captured React's JSX runtime and made every screen import it.
    chunkSizeWarningLimit: 1000,
  },
  server: { host: "127.0.0.1", port: 5173 },
  preview: { host: "127.0.0.1", port: 4173 },
});
