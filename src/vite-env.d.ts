/// <reference types="vite/client" />

// 声明webp模块
declare module '*.webp' {
  const src: string;
  export default src;
}
