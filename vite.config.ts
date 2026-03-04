import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 优化chunk命名
        chunkFileNames: 'js/[name]-[hash].js',
        // 优化资源命名
        assetFileNames: assetInfo => {
          const name = assetInfo.name || 'asset';
          const info = name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/webp/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用源码映射（开发时）
    sourcemap: false,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      '@tanstack/react-virtual',
      'react-virtualized-auto-sizer',
      'zustand',
      'lz-string',
    ],
  },
  server: {
    host: true,
  },
});
