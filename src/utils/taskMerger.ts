import type { CraftingTask } from '@/types/index';

// 合并后的任务项接口
export interface MergedTask {
  id: string; // 使用第一个任务的 id
  recipeId: string;
  itemId: string;
  quantity: number; // 合并后的总数量
  progress: number; // 加权平均进度
  startTime: number; // 最早的开始时间
  craftingTime: number;
  status?: 'pending' | 'crafting' | 'completed';
  chainId?: string;
  // 合并相关字段
  isMerged: boolean; // 标识是否为合并任务
  originalTasks: CraftingTask[]; // 原始任务列表
  mergedCount: number; // 合并的任务数量
}

/**
 * 任务合并算法
 * 将连续的相同任务合并为一个显示项，但链式任务不能合并
 *
 * @param tasks 原始任务队列
 * @returns 合并后的任务列表
 */
export function mergeCraftingTasks(tasks: CraftingTask[]): MergedTask[] {
  if (tasks.length === 0) {
    return [];
  }

  const merged: MergedTask[] = [];
  let currentGroup: CraftingTask[] = [tasks[0]];

  for (let i = 1; i < tasks.length; i++) {
    const currentTask = tasks[i];
    const lastTaskInGroup = currentGroup[currentGroup.length - 1];

    // 检查是否可以合并：
    // 1. 相同的 itemId 和 recipeId
    // 2. 相同的 quantity（数量）
    // 3. 都不是链式任务（chainId 为空）
    // 4. 状态都不是已完成（进行中和未进行的可以合并）
    const canMerge =
      currentTask.itemId === lastTaskInGroup.itemId &&
      currentTask.recipeId === lastTaskInGroup.recipeId &&
      currentTask.quantity === lastTaskInGroup.quantity &&
      !currentTask.chainId &&
      !lastTaskInGroup.chainId &&
      currentTask.status !== 'completed' &&
      lastTaskInGroup.status !== 'completed';

    if (canMerge) {
      // 可以合并，添加到当前组
      currentGroup.push(currentTask);
    } else {
      // 不能合并，处理当前组并开始新组
      merged.push(createMergedTask(currentGroup));
      currentGroup = [currentTask];
    }
  }

  // 处理最后一组
  merged.push(createMergedTask(currentGroup));

  return merged;
}

/**
 * 从任务组创建合并任务
 */
function createMergedTask(tasks: CraftingTask[]): MergedTask {
  if (tasks.length === 1) {
    // 单个任务，不需要合并
    const task = tasks[0];
    return {
      ...task,
      isMerged: false,
      originalTasks: [task],
      mergedCount: 1,
    };
  }

  // 多个任务，需要合并
  const firstTask = tasks[0];
  const totalQuantity = tasks.reduce((sum, task) => sum + task.quantity, 0);

  // 进度显示逻辑：只显示当前进行中任务的进度，如果没有进行中任务则显示0
  const craftingTask = tasks.find(task => task.status === 'crafting');
  const displayProgress = craftingTask ? craftingTask.progress : 0;

  // 找到最早的开始时间
  const earliestStartTime = Math.min(...tasks.map(task => task.startTime));

  // 合并状态逻辑：如果有进行中的任务，显示为进行中；否则显示为等待中
  const hasCraftingTask = tasks.some(task => task.status === 'crafting');
  const mergedStatus = hasCraftingTask ? 'crafting' : 'pending';

  return {
    id: firstTask.id, // 使用第一个任务的 id
    recipeId: firstTask.recipeId,
    itemId: firstTask.itemId,
    quantity: totalQuantity,
    progress: displayProgress,
    startTime: earliestStartTime,
    craftingTime: firstTask.craftingTime,
    status: mergedStatus,
    chainId: firstTask.chainId, // 已经确保是 undefined（非链式任务）
    isMerged: true,
    originalTasks: [...tasks],
    mergedCount: tasks.length,
  };
}

/**
 * 从合并任务中提取原始任务ID列表
 * 用于任务取消操作
 */
export function getOriginalTaskIds(mergedTask: MergedTask): string[] {
  return mergedTask.originalTasks.map(task => task.id);
}

/**
 * 检查任务是否可以被合并
 */
export function canTasksBeMerged(task1: CraftingTask, task2: CraftingTask): boolean {
  return (
    task1.itemId === task2.itemId &&
    task1.recipeId === task2.recipeId &&
    task1.quantity === task2.quantity &&
    !task1.chainId &&
    !task2.chainId &&
    task1.status !== 'completed' &&
    task2.status !== 'completed'
  );
}

/**
 * 获取要取消的任务ID列表
 * 处理合并任务、链式任务和普通任务的取消逻辑
 */
export function getTaskIdsToCancel(
  task: MergedTask | CraftingTask,
  allTasks: CraftingTask[]
): string[] {
  // 如果是合并任务
  if ('isMerged' in task && task.isMerged) {
    return getOriginalTaskIds(task as MergedTask);
  }

  // 如果是链式任务，取消整个链
  if (task.chainId) {
    const allChainTasks = allTasks.filter(t => t.chainId === task.chainId);
    return allChainTasks.map(t => t.id);
  }

  // 普通单个任务
  return [task.id];
}
