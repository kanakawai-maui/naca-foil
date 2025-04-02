// vite.config.js / vite.config.ts
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import pkg from './package.json'


export default defineConfig({
    build: {
      target: 'esnext',
      minify: 'terser',
      lib: {
        entry: resolve(__dirname, 'src/scene.ts'),
        name: 'NacaFoilScene',
        formats: ['es', 'umd', 'iife', 'cjs'],
        fileName: format => `naca-foil.${format}.js`,
      },
      rollupOptions: {
        output: {
          banner: `
/*!
* naca-foil v${pkg.version}
* https://github.com/kanakawai-maui/naca-foil
*/
          `,
          footer: `
            if (globalThis.NacaFoilScene) {
              for (const key of Object.keys(globalThis.NacaFoilScene)) {
                globalThis[key] = globalThis.NacaFoilScene[key]
              }
            }
          `,
        },
      },
    },
    plugins: [dts()],
  });