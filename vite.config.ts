// vite.config.js / vite.config.ts
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import pkg from "./package.json";
import wasm from 'vite-plugin-wasm';

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
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "NacaFoil",
      formats: ["es", "umd", "iife", "cjs"],
      fileName: (format) => `naca-foil.${format}.js`,
    },
    rollupOptions: {
      output: {
        banner: `/*!
        * naca-foil v${pkg.version}
        * https://github.com/kanakawai-maui/naca-foil
        */`,
        footer: `if (globalThis.NacaFoil) {
          for (const key of Object.keys(globalThis.NacaFoil)) {
            globalThis[key] = globalThis.NacaFoil[key];
          }
        }`,
      },
    },
  },
  plugins: [dts(), wasm()],
  test: {
    globals: true,
    environment: 'node',
  },
});
