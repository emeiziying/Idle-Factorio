import { describe, it, expect } from 'vitest';
import { mergeCraftingTasks, getOriginalTaskIds, canTasksBeMerged } from '../taskMerger';
import type { CraftingTask } from '@/types/index';

describe('taskMerger', () => {
  // 创建测试任务的帮助函数
  const createTask = (
    id: string,
    itemId: string,
    recipeId: string,
    quantity: number = 1,
    progress: number = 0,
    chainId?: string,
    status: 'pending' | 'crafting' | 'completed' = 'crafting'
  ): CraftingTask => ({
    id,
    recipeId,
    itemId,
    quantity,
    progress,
    startTime: Date.now(),
    craftingTime: 1000,
    status,
    chainId,
  });

  describe('mergeCraftingTasks', () => {
    it('should return empty array for empty input', () => {
      const result = mergeCraftingTasks([]);
      expect(result).toEqual([]);
    });

    it('should not merge single task', () => {
      const tasks = [createTask('1', 'wood', 'wood-recipe', 5, 50)];
      const result = mergeCraftingTasks(tasks);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        itemId: 'wood',
        quantity: 5,
        progress: 50,
        isMerged: false,
        mergedCount: 1,
      });
    });

    it('should merge consecutive identical tasks with same quantity', () => {
      const tasks = [
        createTask('1', 'wood', 'wood-recipe', 2, 20), // 相同数量
        createTask('2', 'wood', 'wood-recipe', 2, 60), // 相同数量
        createTask('3', 'wood', 'wood-recipe', 2, 80), // 相同数量
      ];
      const result = mergeCraftingTasks(tasks);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1', // 使用第一个任务的 id
        itemId: 'wood',
        quantity: 6, // 2 + 2 + 2
        isMerged: true,
        mergedCount: 3,
      });

      // 检查进度显示：应该显示第一个进行中任务的进度，这里都是 crafting 状态，显示第一个任务的进度
      expect(result[0].progress).toBe(20); // 第一个任务的进度
    });

    it('should not merge tasks with different quantities', () => {
      const tasks = [
        createTask('1', 'wood', 'wood-recipe', 1, 20), // 数量1
        createTask('2', 'wood', 'wood-recipe', 5, 60), // 数量5
        createTask('3', 'wood', 'wood-recipe', 1, 80), // 数量1
      ];
      const result = mergeCraftingTasks(tasks);

      expect(result).toHaveLength(3); // 不应该合并，因为数量不同
      expect(result[0]).toMatchObject({
        id: '1',
        itemId: 'wood',
        quantity: 1,
        isMerged: false,
        mergedCount: 1,
      });
      expect(result[1]).toMatchObject({
        id: '2',
        itemId: 'wood',
        quantity: 5,
        isMerged: false,
        mergedCount: 1,
      });
      expect(result[2]).toMatchObject({
        id: '3',
        itemId: 'wood',
        quantity: 1,
        isMerged: false,
        mergedCount: 1,
      });
    });

    it('should not merge different items', () => {
      const tasks = [
        createTask('1', 'wood', 'wood-recipe', 5, 20),
        createTask('2', 'iron-ore', 'iron-ore-recipe', 3, 60),
      ];
      const result = mergeCraftingTasks(tasks);

      expect(result).toHaveLength(2);
      expect(result[0].isMerged).toBe(false);
      expect(result[1].isMerged).toBe(false);
    });

    it('should not merge different recipes for same item', () => {
      const tasks = [
        createTask('1', 'wood', 'wood-recipe-1', 5, 20),
        createTask('2', 'wood', 'wood-recipe-2', 3, 60),
      ];
      const result = mergeCraftingTasks(tasks);

      expect(result).toHaveLength(2);
      expect(result[0].isMerged).toBe(false);
      expect(result[1].isMerged).toBe(false);
    });

    it('should not merge chain tasks', () => {
      const tasks = [
        createTask('1', 'wood', 'wood-recipe', 5, 20, 'chain-1'),
        createTask('2', 'wood', 'wood-recipe', 3, 60, 'chain-1'),
      ];
      const result = mergeCraftingTasks(tasks);

      expect(result).toHaveLength(2);
      expect(result[0].isMerged).toBe(false);
      expect(result[1].isMerged).toBe(false);
    });

    it('should merge tasks with different non-completed status and same quantity', () => {
      const tasks = [
        createTask('1', 'wood', 'wood-recipe', 2, 20, undefined, 'crafting'), // 相同数量
        createTask('2', 'wood', 'wood-recipe', 2, 60, undefined, 'pending'), // 相同数量
      ];
      const result = mergeCraftingTasks(tasks);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        itemId: 'wood',
        quantity: 4, // 2 + 2
        isMerged: true,
        mergedCount: 2,
        status: 'crafting', // 有进行中任务时显示为进行中
      });
      expect(result[0].progress).toBe(20); // 显示进行中任务的进度
    });

    it('should merge pending tasks and show as pending', () => {
      const tasks = [
        createTask('1', 'wood', 'wood-recipe', 2, 0, undefined, 'pending'), // 相同数量
        createTask('2', 'wood', 'wood-recipe', 2, 0, undefined, 'pending'), // 相同数量
      ];
      const result = mergeCraftingTasks(tasks);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        itemId: 'wood',
        quantity: 4, // 2 + 2
        progress: 0, // 没有进行中任务，显示0进度
        isMerged: true,
        mergedCount: 2,
        status: 'pending', // 都是等待中时显示为等待中
      });
    });

    it('should show progress of crafting task when mixing crafting and pending', () => {
      const tasks = [
        createTask('1', 'wood', 'wood-recipe', 1, 0, undefined, 'pending'), // 等待中
        createTask('2', 'wood', 'wood-recipe', 1, 75, undefined, 'crafting'), // 进行中，75%进度
        createTask('3', 'wood', 'wood-recipe', 1, 0, undefined, 'pending'), // 等待中
      ];
      const result = mergeCraftingTasks(tasks);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        itemId: 'wood',
        quantity: 3,
        progress: 75, // 显示进行中任务的进度
        isMerged: true,
        mergedCount: 3,
        status: 'crafting', // 有进行中任务时显示为进行中
      });
    });

    it('should not merge completed tasks with other tasks', () => {
      const tasks = [
        createTask('1', 'wood', 'wood-recipe', 5, 100, undefined, 'completed'),
        createTask('2', 'wood', 'wood-recipe', 3, 60, undefined, 'pending'),
      ];
      const result = mergeCraftingTasks(tasks);

      expect(result).toHaveLength(2);
      expect(result[0].isMerged).toBe(false);
      expect(result[1].isMerged).toBe(false);
    });

    it('should handle complex sequence: wood, wood, iron, wood', () => {
      const tasks = [
        createTask('1', 'wood', 'wood-recipe', 1, 20),
        createTask('2', 'wood', 'wood-recipe', 1, 40),
        createTask('3', 'iron-ore', 'iron-ore-recipe', 1, 60),
        createTask('4', 'wood', 'wood-recipe', 1, 80),
      ];
      const result = mergeCraftingTasks(tasks);

      expect(result).toHaveLength(3);

      // 第一组：合并的两个木材任务
      expect(result[0]).toMatchObject({
        id: '1',
        itemId: 'wood',
        quantity: 2,
        isMerged: true,
        mergedCount: 2,
      });
      expect(result[0].progress).toBe(20); // 显示第一个进行中任务的进度

      // 第二组：单独的铁矿任务
      expect(result[1]).toMatchObject({
        id: '3',
        itemId: 'iron-ore',
        quantity: 1,
        isMerged: false,
        mergedCount: 1,
      });

      // 第三组：单独的木材任务
      expect(result[2]).toMatchObject({
        id: '4',
        itemId: 'wood',
        quantity: 1,
        isMerged: false,
        mergedCount: 1,
      });
    });

    it('should use earliest start time for merged tasks', () => {
      const baseTime = Date.now();
      const tasks: CraftingTask[] = [
        {
          id: '1',
          recipeId: 'wood-recipe',
          itemId: 'wood',
          quantity: 1,
          progress: 20,
          startTime: baseTime + 1000,
          craftingTime: 1000,
          status: 'crafting',
        },
        {
          id: '2',
          recipeId: 'wood-recipe',
          itemId: 'wood',
          quantity: 1,
          progress: 40,
          startTime: baseTime + 500, // 更早的开始时间
          craftingTime: 1000,
          status: 'crafting',
        },
      ];

      const result = mergeCraftingTasks(tasks);
      expect(result[0].startTime).toBe(baseTime + 500);
    });
  });

  describe('getOriginalTaskIds', () => {
    it('should return single id for non-merged task', () => {
      const task = createTask('1', 'wood', 'wood-recipe', 1, 20);
      const mergedTask = {
        ...task,
        isMerged: false,
        originalTasks: [task],
        mergedCount: 1,
      };

      const result = getOriginalTaskIds(mergedTask);
      expect(result).toEqual(['1']);
    });

    it('should return multiple ids for merged task', () => {
      const task1 = createTask('1', 'wood', 'wood-recipe', 1, 20);
      const task2 = createTask('2', 'wood', 'wood-recipe', 1, 40);
      const mergedTask = {
        ...task1,
        quantity: 2,
        progress: 30,
        isMerged: true,
        originalTasks: [task1, task2],
        mergedCount: 2,
      };

      const result = getOriginalTaskIds(mergedTask);
      expect(result).toEqual(['1', '2']);
    });
  });

  describe('canTasksBeMerged', () => {
    it('should return true for identical non-chain tasks', () => {
      const task1 = createTask('1', 'wood', 'wood-recipe', 1, 20);
      const task2 = createTask('2', 'wood', 'wood-recipe', 1, 40);

      expect(canTasksBeMerged(task1, task2)).toBe(true);
    });

    it('should return false for different items', () => {
      const task1 = createTask('1', 'wood', 'wood-recipe', 1, 20);
      const task2 = createTask('2', 'iron-ore', 'iron-ore-recipe', 1, 40);

      expect(canTasksBeMerged(task1, task2)).toBe(false);
    });

    it('should return false for different recipes', () => {
      const task1 = createTask('1', 'wood', 'wood-recipe-1', 1, 20);
      const task2 = createTask('2', 'wood', 'wood-recipe-2', 1, 40);

      expect(canTasksBeMerged(task1, task2)).toBe(false);
    });

    it('should return false for chain tasks', () => {
      const task1 = createTask('1', 'wood', 'wood-recipe', 1, 20, 'chain-1');
      const task2 = createTask('2', 'wood', 'wood-recipe', 1, 40, 'chain-1');

      expect(canTasksBeMerged(task1, task2)).toBe(false);
    });

    it('should return true for different non-completed status with same quantity', () => {
      const task1 = createTask('1', 'wood', 'wood-recipe', 2, 20, undefined, 'crafting');
      const task2 = createTask('2', 'wood', 'wood-recipe', 2, 40, undefined, 'pending');

      expect(canTasksBeMerged(task1, task2)).toBe(true);
    });

    it('should return false for different quantities', () => {
      const task1 = createTask('1', 'wood', 'wood-recipe', 1, 20, undefined, 'crafting');
      const task2 = createTask('2', 'wood', 'wood-recipe', 5, 40, undefined, 'crafting');

      expect(canTasksBeMerged(task1, task2)).toBe(false);
    });

    it('should return false for completed tasks', () => {
      const task1 = createTask('1', 'wood', 'wood-recipe', 1, 100, undefined, 'completed');
      const task2 = createTask('2', 'wood', 'wood-recipe', 1, 40, undefined, 'pending');

      expect(canTasksBeMerged(task1, task2)).toBe(false);
    });
  });
});
