// 库存操作接口定义

export interface InventoryOperations {
  /**
   * 获取物品当前数量
   */
  getItemAmount: (itemId: string) => number;

  /**
   * 更新物品数量
   */
  updateItemAmount: (itemId: string, change: number) => void;

  /**
   * 检查是否有足够的物品
   */
  hasEnoughItems: (requirements: Record<string, number>) => boolean;

  /**
   * 消耗物品
   */
  consumeItems: (requirements: Record<string, number>) => boolean;
}
