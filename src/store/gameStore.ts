// 向后兼容的 gameStore 代理
// 这个文件保持与原始 gameStore.ts 相同的导出接口，
// 但内部使用重构后的模块化 store

import useGameStore from './index';

// 默认导出，保持向后兼容
export default useGameStore;

// 重新导出类型
export type { GameState } from './types';