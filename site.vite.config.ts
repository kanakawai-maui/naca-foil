// vite.config.js / vite.config.ts
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import pkg from "./package.json";

if (process.env.NODE_ENV !== "production") {
  console.warn(
    "Warning: This configuration is not optimized for production use.",
  );
}

// https://github.com/vitejs/vite/discussions/8222
export default defineConfig({
  build: {
    target: "esnext",
    minify: "terser",
    outDir: "site",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.ts"),
        demo: resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "assets/[name].[ext]",
        manualChunks: undefined,
        banner: `/*!
      * naca-foil v${pkg.version}
      * https://github.com/kanakawai-maui/naca-foil
      */`,
      },
    },
  },
  plugins: [dts()],
});
