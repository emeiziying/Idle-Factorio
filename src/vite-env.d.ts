/// <reference types="vite/client" />

// 声明webp模块
declare module '*.webp' {
  const src: string;
  export default src;
}

// 声明png模块
declare module '*.png' {
  const src: string;
  export default src;
}

// HMR type declarations
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: {
    readonly data: unknown;
    accept(): void;
    accept(cb: (mod: unknown) => void): void;
    accept(dep: string, cb: (mod: unknown) => void): void;
    accept(deps: readonly string[], cb: (mods: unknown[]) => void): void;
    dispose(cb: (data: unknown) => void): void;
    decline(): void;
    invalidate(): void;
    on(event: string, cb: (...args: unknown[]) => void): void;
  };
}
