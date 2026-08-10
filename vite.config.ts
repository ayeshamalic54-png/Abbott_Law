import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

const getDirname = () => {
  if (typeof __dirname !== "undefined") return __dirname;
  if (typeof import.meta !== "undefined" && import.meta.url) {
    return path.dirname(fileURLToPath(import.meta.url));
  }
  return process.cwd();
};
const _dir = getDirname();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    metaImagesPlugin(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-runtime-error-modal").then((m) =>
            m.default ? m.default() : m(),
          ).catch(() => null),
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ).catch(() => null),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ).catch(() => null),
        ].filter(Boolean)
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(_dir, "client", "src"),
      "@shared": path.resolve(_dir, "shared"),
      "@assets": path.resolve(_dir, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(_dir, "client"),
  build: {
    outDir: path.resolve(_dir, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
