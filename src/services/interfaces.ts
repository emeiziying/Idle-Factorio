/**
 * 服务接口定义
 * 用于解耦服务之间的依赖关系
 */

import type { FacilityInstance } from '../types/facilities';
import type { InventoryItem } from '../types/index';

/**
 * 游戏状态提供者接口
 * 用于 TechnologyService 获取游戏状态
 */
export interface GameStateProvider {
  getFacilities(): FacilityInstance[];
  getInventoryItem(itemId: string): InventoryItem;
}

/**
 * 服务工厂接口
 */
export interface ServiceFactory {
  getGameStateProvider(): GameStateProvider;
}