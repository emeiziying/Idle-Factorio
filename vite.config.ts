import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Idle-Factorio/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动分块策略
        manualChunks: id => {
          // 第三方库分块
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-vendor';
            }
            if (id.includes('@tanstack') || id.includes('react-virtualized')) {
              return 'virtualization-vendor';
            }
            if (id.includes('zustand') || id.includes('lz-string')) {
              return 'utils-vendor';
            }
            // 其他第三方库
            return 'vendor';
          }
          // 游戏数据分块
          if (id.includes('data/spa/data.json')) {
            return 'game-data';
          }
          if (id.includes('data/spa/i18n/')) {
            return 'i18n-data';
          }
          if (id.includes('data/spa/icons.webp')) {
            return 'game-assets';
          }
          // 服务层分块
          if (id.includes('services/')) {
            return 'services';
          }
          // 组件分块
          if (id.includes('components/')) {
            return 'components';
          }
        },
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
});
