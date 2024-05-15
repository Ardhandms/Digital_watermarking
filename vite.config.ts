import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import wasm from 'vite-plugin-wasm';
import commonjs from 'vite-plugin-commonjs';
import { resolve } from 'path';

export default defineConfig({
    build: {
        target: 'esnext',
        lib: {
            entry: resolve(__dirname, './src/lib/watermarking.ts'),
            name: '@mizuka-wu/web-digital-watermarking',
            fileName: 'web-digital-watermarking'
        }
    },
    define: {
        global: 'window'
    },
    optimizeDeps: {
    },
    plugins: [
        dts({
            include: [resolve(__dirname, 'src/lib/**/*.ts')]
        }),
        wasm(),
        commonjs(),
    ]
})