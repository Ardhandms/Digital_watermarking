import { defineConfig } from 'vite';
import config from './vite.config';

export default defineConfig({
    base: '/web-digital-watermarking',
    ...config,
    build: {
        outDir: 'demo',
    }
})