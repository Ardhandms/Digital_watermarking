import { build, defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path'

export default {
    build: {
        lib: {
            entry: resolve(__dirname, './src/lib/watermarking.ts'),
            name: 'web-digital-watermarking',
            fileName: 'web-digital-watermarking'
        }
    },
    plugins: [dts({
        include: [resolve(__dirname, 'src/lib/**/*.ts')]
    })]
}