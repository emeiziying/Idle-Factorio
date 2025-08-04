/**
 * 本地存储键名统一管理
 * 避免键名冲突，便于维护和查找
 */

// 应用主要设置
export const APP_STORAGE_KEYS = {
  CURRENT_MODULE: 'app-current-module',
} as const;

// 生产模块相关
export const PRODUCTION_STORAGE_KEYS = {
  SELECTED_CATEGORY: 'production-selected-category',
  SELECTED_ITEM: 'production-selected-item',
  // 可以添加其他生产相关的存储键
  // FAVORITE_ITEMS: 'production-favorite-items',
  // VIEW_MODE: 'production-view-mode',
} as const;

// 科技模块相关
export const TECHNOLOGY_STORAGE_KEYS = {
  SELECTED_TECH: 'technology-selected-tech',
} as const;

// 游戏设置相关
export const SETTINGS_STORAGE_KEYS = {
  // 可以添加设置相关的存储键
  // THEME: 'settings-theme',
  // LANGUAGE: 'settings-language',
} as const;

// 用户偏好相关
export const USER_PREFERENCE_KEYS = {
  // 可以添加用户偏好相关的存储键
  // SIDEBAR_COLLAPSED: 'user-sidebar-collapsed',
  // TUTORIAL_COMPLETED: 'user-tutorial-completed',
} as const;

// 导出所有存储键的联合类型（用于类型检查）
export type StorageKey =
  | (typeof APP_STORAGE_KEYS)[keyof typeof APP_STORAGE_KEYS]
  | (typeof PRODUCTION_STORAGE_KEYS)[keyof typeof PRODUCTION_STORAGE_KEYS]
  | (typeof TECHNOLOGY_STORAGE_KEYS)[keyof typeof TECHNOLOGY_STORAGE_KEYS]
  | (typeof SETTINGS_STORAGE_KEYS)[keyof typeof SETTINGS_STORAGE_KEYS]
  | (typeof USER_PREFERENCE_KEYS)[keyof typeof USER_PREFERENCE_KEYS];
