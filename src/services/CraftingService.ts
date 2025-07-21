import { CraftingTask, Recipe, InventoryItem } from '../types';
import { DataService } from './DataService';
import { useGameStore } from '../store/gameStore';

export class CraftingService {
  private static instance: CraftingService;
  private dataService: DataService;
  private updateInterval: NodeJS.Timer | null = null;

  private constructor() {
    this.dataService = DataService.getInstance();
  }

  public static getInstance(): CraftingService {
    if (!CraftingService.instance) {
      CraftingService.instance = new CraftingService();
    }
    return CraftingService.instance;
  }

  // 开始制作任务
  public async startCrafting(recipeId: string, quantity: number): Promise<{ success: boolean; message: string }> {
    const store = useGameStore.getState();
    const recipe = await this.dataService.getRecipe(recipeId);
    
    if (!recipe) {
      return { success: false, message: '配方不存在' };
    }

    // 检查制作队列是否已满
    if (store.craftingQueue.length >= 10) {
      return { success: false, message: '制作队列已满（最多10个任务）' };
    }

    // 检查原料是否充足
    const checkResult = this.checkIngredients(recipe, quantity);
    if (!checkResult.success) {
      return checkResult;
    }

    // 消耗原料
    this.consumeIngredients(recipe, quantity);

    // 创建制作任务
    const task: CraftingTask = {
      id: `craft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipeId: recipe.id,
      quantity: quantity,
      progress: 0,
      startTime: Date.now()
    };

    // 添加到队列
    store.addCraftingTask(task);

    // 启动更新循环
    this.startUpdateLoop();

    return { success: true, message: `开始制作 ${quantity} 个 ${recipe.name}` };
  }

  // 检查原料是否充足
  private checkIngredients(recipe: Recipe, quantity: number): { success: boolean; message: string } {
    const store = useGameStore.getState();
    const missingItems: string[] = [];

    for (const [itemId, requiredAmount] of Object.entries(recipe.in)) {
      const inventoryItem = store.getInventoryItem(itemId);
      const available = inventoryItem?.currentAmount || 0;
      const needed = requiredAmount * quantity;

      if (available < needed) {
        missingItems.push(`${itemId} (需要${needed}，拥有${available})`);
      }
    }

    if (missingItems.length > 0) {
      return { 
        success: false, 
        message: `原料不足: ${missingItems.join(', ')}` 
      };
    }

    return { success: true, message: '' };
  }

  // 消耗原料
  private consumeIngredients(recipe: Recipe, quantity: number): void {
    const store = useGameStore.getState();

    for (const [itemId, requiredAmount] of Object.entries(recipe.in)) {
      store.updateInventory(itemId, -requiredAmount * quantity);
    }
  }

  // 完成制作任务
  private async completeCrafting(task: CraftingTask): Promise<void> {
    const store = useGameStore.getState();
    const recipe = await this.dataService.getRecipe(task.recipeId);
    
    if (!recipe) return;

    // 添加产出物品到库存
    for (const [itemId, outputAmount] of Object.entries(recipe.out)) {
      store.updateInventory(itemId, outputAmount * task.quantity);
    }

    // 从队列中移除
    store.removeCraftingTask(task.id);

    console.log(`制作完成: ${task.quantity} 个 ${recipe.name}`);
  }

  // 更新制作进度
  public async updateCraftingProgress(): Promise<void> {
    const store = useGameStore.getState();
    const currentTime = Date.now();
    const tasksToComplete: CraftingTask[] = [];

    for (const task of store.craftingQueue) {
      const recipe = await this.dataService.getRecipe(task.recipeId);
      if (!recipe) continue;

      const elapsedTime = (currentTime - task.startTime) / 1000; // 转换为秒
      const totalTime = recipe.time * task.quantity;
      const progress = Math.min(100, (elapsedTime / totalTime) * 100);

      // 更新进度
      store.updateCraftingTask(task.id, { progress });

      // 检查是否完成
      if (progress >= 100) {
        tasksToComplete.push(task);
      }
    }

    // 完成已经完成的任务
    for (const task of tasksToComplete) {
      await this.completeCrafting(task);
    }

    // 如果没有任务了，停止更新循环
    if (store.craftingQueue.length === 0) {
      this.stopUpdateLoop();
    }
  }

  // 启动更新循环
  private startUpdateLoop(): void {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      this.updateCraftingProgress();
    }, 100); // 每100ms更新一次
  }

  // 停止更新循环
  private stopUpdateLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // 获取制作任务信息
  public async getCraftingTaskInfo(task: CraftingTask): Promise<{
    recipe: Recipe | null;
    progress: number;
    remainingTime: number;
    itemsPerSecond: number;
  }> {
    const recipe = await this.dataService.getRecipe(task.recipeId);
    if (!recipe) {
      return { recipe: null, progress: 0, remainingTime: 0, itemsPerSecond: 0 };
    }

    const currentTime = Date.now();
    const elapsedTime = (currentTime - task.startTime) / 1000;
    const totalTime = recipe.time * task.quantity;
    const progress = Math.min(100, (elapsedTime / totalTime) * 100);
    const remainingTime = Math.max(0, totalTime - elapsedTime);
    
    // 计算每秒产出
    const itemsPerSecond = recipe.time > 0 ? 1 / recipe.time : 0;

    return { recipe, progress, remainingTime, itemsPerSecond };
  }

  // 取消制作任务
  public async cancelCrafting(taskId: string): Promise<{ success: boolean; message: string }> {
    const store = useGameStore.getState();
    const task = store.craftingQueue.find(t => t.id === taskId);
    
    if (!task) {
      return { success: false, message: '任务不存在' };
    }

    const recipe = await this.dataService.getRecipe(task.recipeId);
    if (!recipe) {
      return { success: false, message: '配方不存在' };
    }

    // 返还部分原料（根据进度）
    const refundRate = 1 - (task.progress / 100) * 0.5; // 返还50%-100%的原料
    for (const [itemId, amount] of Object.entries(recipe.in)) {
      const refundAmount = Math.floor(amount * task.quantity * refundRate);
      store.updateInventory(itemId, refundAmount);
    }

    // 移除任务
    store.removeCraftingTask(taskId);

    return { 
      success: true, 
      message: `已取消制作 ${recipe.name}，返还了部分原料` 
    };
  }

  // 获取制作队列摘要
  public async getCraftingQueueSummary(): Promise<{
    totalTasks: number;
    totalProgress: number;
    estimatedTotalTime: number;
  }> {
    const store = useGameStore.getState();
    let totalProgress = 0;
    let estimatedTotalTime = 0;

    for (const task of store.craftingQueue) {
      const info = await this.getCraftingTaskInfo(task);
      totalProgress += info.progress;
      estimatedTotalTime += info.remainingTime;
    }

    return {
      totalTasks: store.craftingQueue.length,
      totalProgress: store.craftingQueue.length > 0 ? totalProgress / store.craftingQueue.length : 0,
      estimatedTotalTime
    };
  }

  // 初始化服务（恢复进行中的任务）
  public initialize(): void {
    const store = useGameStore.getState();
    if (store.craftingQueue.length > 0) {
      this.startUpdateLoop();
    }
  }

  // 清理服务
  public cleanup(): void {
    this.stopUpdateLoop();
  }
}