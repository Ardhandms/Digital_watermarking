/**
 * 打包生成演示网站使用
 */
import { defineConfig } from 'vite';
import config from './vite.config';

export default defineConfig({
    base: '/web-digital-watermarking',
    ...config,
    build: {
        outDir: 'demo',
    }
})