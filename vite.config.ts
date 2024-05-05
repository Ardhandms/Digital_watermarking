import { build, defineConfig } from 'vite';
import { resolve } from 'path'

export default {
    build: {
        lib: {
            entry: resolve(__dirname, './src/lib/watermarking.ts'),
            name: 'web-digital-watermarking',
            fileName: 'web-digital-watermarking'
        }
    }
}