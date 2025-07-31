// 主游戏循环 - 统一管理所有游戏系统的更新
import GameLoopManager from '@/utils/GameLoopManager';
import useGameTimeStore from '@/store/gameTimeStore';
import useGameStore from '@/store/gameStore';
import CraftingEngine from '@/utils/craftingEngine';
import { FuelService, PowerService, RecipeService, DataService } from '@/services';
import type { FacilityInstance } from '@/types/facilities';
import type { CraftingTask, Recipe } from '@/types/index';
import { secondsToMs } from '@/utils/common';

/**
 * 游戏系统更新间隔配置
 */
const UPDATE_INTERVALS = {
  CRAFTING: 100,      // 制作系统 - 100ms
  PRODUCTION: 1000,   // 生产系统 - 1000ms
  RESEARCH: 1000,     // 研究系统 - 1000ms
  AUTOSAVE: 10000,    // 自动存档 - 10s
  DATA_CHECK: 100,    // 数据检查 - 100ms
} as const;

/**
 * 主游戏循环类
 * 负责协调所有游戏系统的更新，使用时间累积器来控制不同频率的更新
 */
export class MainGameLoop {
  private static instance: MainGameLoop | null = null;
  
  private gameLoopManager: GameLoopManager;
  
  // 时间累积器 - 用于控制不同频率的系统更新
  private accumulators = {
    crafting: 0,
    production: 0,
    research: 0,
    autosave: 0,
    dataCheck: 0,
  };
  
  // 系统服务实例
  private fuelService = FuelService.getInstance();
  private powerService = PowerService.getInstance();
  private craftingEngine = CraftingEngine.getInstance();
  
  private constructor() {
    this.gameLoopManager = GameLoopManager.getInstance();
  }
  
  static getInstance(): MainGameLoop {
    if (!MainGameLoop.instance) {
      MainGameLoop.instance = new MainGameLoop();
    }
    return MainGameLoop.instance;
  }
  
  /**
   * 启动主游戏循环
   */
  start(): void {
    const taskInfo = this.gameLoopManager.getTaskInfo('main-game-loop');
    if (taskInfo) {
      return; // 已经在运行
    }
    
    this.resetAccumulators();
    
    // 注册到 GameLoopManager，60fps
    this.gameLoopManager.register('main-game-loop', this.update.bind(this), 16);
  }
  
  /**
   * 停止主游戏循环
   */
  stop(): void {
    this.gameLoopManager.unregister('main-game-loop');
  }
  
  /**
   * 主更新循环 - 每帧调用（约60fps）
   */
  private update(deltaTime: number): void {
    try {
      // 1. 每帧都执行：更新游戏时间
      this.updateGameTime(deltaTime);
      
      // 2. 累积时间并检查是否需要更新各个系统
      this.updateAccumulators(deltaTime * 1000); // deltaTime是秒，转换为毫秒
      
      // 3. 根据累积时间更新各个系统
      this.updateSystems();
      
    } catch (error) {
      console.error('Main game loop error:', error);
    }
  }
  
  /**
   * 更新游戏时间 - 每帧执行
   */
  private updateGameTime(deltaTime: number): void {
    const timeStore = useGameTimeStore.getState();
    timeStore.incrementGameTime(deltaTime * 1000); // 转换为毫秒
  }
  
  /**
   * 更新时间累积器
   */
  private updateAccumulators(deltaTimeMs: number): void {
    this.accumulators.crafting += deltaTimeMs;
    this.accumulators.production += deltaTimeMs;
    this.accumulators.research += deltaTimeMs;
    this.accumulators.autosave += deltaTimeMs;
    this.accumulators.dataCheck += deltaTimeMs;
  }
  
  /**
   * 根据累积时间更新各个系统
   */
  private updateSystems(): void {
    // 制作系统更新 (100ms)
    if (this.accumulators.crafting >= UPDATE_INTERVALS.CRAFTING) {
      this.updateCraftingSystem();
      this.accumulators.crafting = 0;
    }
    
    // 生产系统更新 (1000ms)
    if (this.accumulators.production >= UPDATE_INTERVALS.PRODUCTION) {
      this.updateProductionSystem(this.accumulators.production);
      this.accumulators.production = 0;
    }
    
    // 研究系统更新 (1000ms)
    if (this.accumulators.research >= UPDATE_INTERVALS.RESEARCH) {
      this.updateResearchSystem(this.accumulators.research);
      this.accumulators.research = 0;
    }
    
    // 自动存档 (10000ms)
    if (this.accumulators.autosave >= UPDATE_INTERVALS.AUTOSAVE) {
      this.updateAutosave();
      this.accumulators.autosave = 0;
    }
    
    // 数据检查 (100ms) - 仅在数据未加载时执行
    if (this.accumulators.dataCheck >= UPDATE_INTERVALS.DATA_CHECK) {
      this.updateDataCheck();
      this.accumulators.dataCheck = 0;
    }
  }
  
  /**
   * 更新制作系统 - 直接处理制作队列，无需 CraftingEngine 的独立循环
   */
  private updateCraftingSystem(): void {
    const gameStore = useGameStore.getState();
    const { craftingQueue, updateCraftingProgress } = gameStore;

    if (craftingQueue.length === 0) return;

    const now = Date.now();
    const dataService = DataService.getInstance();

    // 处理队列中的第一个任务（只有第一个任务会进行制作）
    const currentTask = craftingQueue[0];
    if (!currentTask || currentTask.status === 'completed') return;

    try {
      // 检查是否为手动合成任务
      if (currentTask.recipeId.startsWith('manual_')) {
        this.processManualCraftingTask(currentTask, now, updateCraftingProgress);
      } else {
        this.processRegularCraftingTask(currentTask, now, dataService, updateCraftingProgress);
      }
    } catch (error) {
      console.error('Crafting system update error:', error);
    }
  }
  
  /**
   * 更新生产系统 - 集成完整的设施生产逻辑
   */
  private updateProductionSystem(deltaTimeMs: number): void {
    const gameStore = useGameStore.getState();
    const { 
      facilities, 
      updateFacility,
      batchUpdateInventory,
      getInventoryItem,
      updateFuelConsumption, 
      autoRefuelFacilities,
      trackCraftedItem,
      trackMinedEntity 
    } = gameStore;
    
    if (facilities.length === 0) return;
    
    const deltaTimeSeconds = deltaTimeMs / 1000;
    
    try {
      // 1. 计算电力平衡
      const powerBalance = this.powerService.calculatePowerBalance(facilities);
      
      // 2. 根据电力平衡更新设施效率
      const updatedFacilities = facilities.map((facility) =>
        this.powerService.updateFacilityPowerStatus(facility, powerBalance)
      );

      // 批量更新设施状态（如果有变化）
      updatedFacilities.forEach((updatedFacility, index) => {
        const originalFacility = facilities[index];
        if (
          originalFacility.efficiency !== updatedFacility.efficiency ||
          originalFacility.status !== updatedFacility.status
        ) {
          updateFacility(updatedFacility.id, {
            efficiency: updatedFacility.efficiency,
            status: updatedFacility.status,
          });
        }
      });
      
      // 3. 更新燃料消耗
      updateFuelConsumption(deltaTimeSeconds);
      
      // 4. 尝试自动补充燃料
      autoRefuelFacilities();
      
      // 5. 更新生产进度
      facilities.forEach((facility) => {
        // 检查设施状态
        if (facility.status === 'no_fuel' && facility.fuelBuffer) {
          // 检查是否有燃料了
          const status = this.fuelService.getFuelStatus(facility.fuelBuffer);
          if (!status.isEmpty) {
            updateFacility(facility.id, { status: 'running' });
          }
        }

        // 更新生产
        if (facility.status === 'running') {
          this.updateFacilityProduction(facility, deltaTimeSeconds, {
            updateFacility,
            batchUpdateInventory,
            getInventoryItem,
            trackCraftedItem,
            trackMinedEntity
          });
        }
      });
      
    } catch (error) {
      console.error('Production system update error:', error);
    }
  }

  /**
   * 更新单个设施的生产进度
   */
  private updateFacilityProduction(
    facility: FacilityInstance,
    deltaTime: number,
    gameStoreActions: {
      updateFacility: (id: string, updates: Partial<FacilityInstance>) => void;
      batchUpdateInventory: (updates: Array<{ itemId: string; amount: number }>) => void;
      getInventoryItem: (itemId: string) => { currentAmount: number; maxCapacity: number };
      trackCraftedItem: (itemId: string, quantity: number) => void;
      trackMinedEntity: (itemId: string, quantity: number) => void;
    }
  ): void {
    const { updateFacility, batchUpdateInventory, getInventoryItem, trackCraftedItem, trackMinedEntity } = gameStoreActions;
    
    if (facility.status !== 'running' || !facility.production) {
      return;
    }

    const { currentRecipeId, progress } = facility.production;
    if (!currentRecipeId) return;

    const recipe = RecipeService.getRecipeById(currentRecipeId);
    if (!recipe) return;

    // 检查是否有足够的输入材料
    let hasEnoughMaterials = true;
    if (recipe.in) {
      for (const [itemId, required] of Object.entries(recipe.in)) {
        const inventory = getInventoryItem(itemId);
        if (inventory.currentAmount < (required as number)) {
          hasEnoughMaterials = false;
          break;
        }
      }
    }

    // 如果材料不足，不更新生产进度
    if (!hasEnoughMaterials) {
      return;
    }

    // 计算生产进度
    const progressIncrement = (deltaTime / recipe.time) * facility.efficiency;
    const newProgress = progress + progressIncrement;

    if (newProgress >= 1.0) {
      // 生产完成
      // 检查输出空间
      let canProduce = true;
      for (const [itemId, quantity] of Object.entries(recipe.out)) {
        const inventory = getInventoryItem(itemId);
        if (inventory.currentAmount + (quantity as number) > inventory.maxCapacity) {
          canProduce = false;
          break;
        }
      }

      if (canProduce) {
        // 准备批量更新数据
        const inventoryUpdates: Array<{ itemId: string; amount: number }> = [];

        // 消耗输入材料
        if (recipe.in) {
          for (const [itemId, quantity] of Object.entries(recipe.in)) {
            inventoryUpdates.push({ itemId, amount: -(quantity as number) });
          }
        }

        // 添加产出
        for (const [itemId, quantity] of Object.entries(recipe.out)) {
          inventoryUpdates.push({ itemId, amount: quantity as number });
          // 追踪制造的物品（用于研究触发器）
          trackCraftedItem(itemId, quantity as number);
          // 如果是采矿配方，同时追踪挖掘的实体
          if (recipe.flags?.includes('mining')) {
            trackMinedEntity(itemId, quantity as number);
          }
        }

        // 批量更新库存（减少存档触发频率）
        batchUpdateInventory(inventoryUpdates);

        // 重置进度
        updateFacility(facility.id, {
          production: {
            ...facility.production,
            progress: newProgress - 1.0, // 保留超出的进度
          },
        });
      } else {
        // 输出已满，停止生产
        updateFacility(facility.id, {
          status: 'output_full',
        });
      }
    } else {
      // 更新进度
      updateFacility(facility.id, {
        production: {
          ...facility.production,
          progress: newProgress,
        },
      });
    }
  }
  
  /**
   * 更新研究系统
   */
  private updateResearchSystem(deltaTimeMs: number): void {
    const gameStore = useGameStore.getState();
    const { researchState, updateResearchProgress } = gameStore;
    
    // 只有在有活跃研究时才更新
    if (!researchState) return;
    
    const deltaTimeSeconds = deltaTimeMs / 1000;
    
    try {
      // 更新研究进度
      updateResearchProgress(deltaTimeSeconds);
    } catch (error) {
      console.error('Research system update error:', error);
    }
  }
  
  /**
   * 执行自动存档
   */
  private updateAutosave(): void {
    try {
      const gameStore = useGameStore.getState();
      gameStore.saveGame();
    } catch (error) {
      console.error('Autosave error:', error);
    }
  }
  
  /**
   * 检查数据加载状态
   */
  private updateDataCheck(): void {
    const gameStore = useGameStore.getState();
    if (!gameStore.dataLoaded) {
      // 如果数据还未加载，触发检查
      gameStore.initializeDataLoading();
    }
  }
  
  /**
   * 重置所有累积器
   */
  private resetAccumulators(): void {
    this.accumulators.crafting = 0;
    this.accumulators.production = 0;
    this.accumulators.research = 0;
    this.accumulators.autosave = 0;
    this.accumulators.dataCheck = 0;
  }
  
  /**
   * 获取当前运行状态
   */
  isRunning(): boolean {
    const taskInfo = this.gameLoopManager.getTaskInfo('main-game-loop');
    return taskInfo !== undefined;
  }
  
  /**
   * 获取调试信息
   */
  getDebugInfo() {
    return {
      isRunning: this.isRunning(),
      accumulators: { ...this.accumulators },
      intervals: UPDATE_INTERVALS,
    };
  }

  /**
   * 处理手动制作任务
   */
  private processManualCraftingTask(
    currentTask: CraftingTask,
    now: number,
    updateCraftingProgress: (id: string, progress: number) => void
  ): void {
    const itemId = currentTask.itemId;

    // 获取物品的配方数据（用于时间计算）
    const recipes = RecipeService.getRecipesThatProduce(itemId);

    // 优先选择mining类型的配方，而不是recycling配方
    let selectedRecipe = null;
    if (recipes.length > 0) {
      // 优先选择mining配方
      const miningRecipe = recipes.find((r) => r.flags?.includes('mining'));
      if (miningRecipe) {
        selectedRecipe = miningRecipe;
      } else {
        // 如果没有mining配方，选择第一个非recycling配方
        const nonRecyclingRecipe = recipes.find((r) => !r.flags?.includes('recycling'));
        selectedRecipe = nonRecyclingRecipe || recipes[0];
      }
    }

    if (selectedRecipe) {
      // 使用手动合成效率计算时间
      const manualEfficiency = 0.5; // 玩家默认效率
      const baseTime = selectedRecipe.time || 1; // 基础时间
      const craftingTime = secondsToMs((baseTime / manualEfficiency) * currentTask.quantity);

      // 确保有开始时间 - 只在第一次执行时设定
      if (!currentTask.startTime || currentTask.startTime === 0) {
        currentTask.startTime = now;
        updateCraftingProgress(currentTask.id, 0);
      }

      // 计算进度
      const elapsed = now - currentTask.startTime;
      const progress = Math.min((elapsed / craftingTime) * 100, 100);

      updateCraftingProgress(currentTask.id, progress);

      // 检查是否完成
      if (progress >= 100) {
        this.completeManualCraft(currentTask, selectedRecipe);
      }
    } else {
      // 如果没有配方（原材料），立即完成
      this.completeManualCraft(currentTask, null);
    }
  }

  /**
   * 处理常规制作任务
   */
  private processRegularCraftingTask(
    currentTask: CraftingTask,
    now: number,
    dataService: DataService,
    updateCraftingProgress: (id: string, progress: number) => void
  ): void {
    const recipe = dataService.getRecipe(currentTask.recipeId);
    if (!recipe) return;

    // 如果任务刚开始，设置开始时间并开始制作
    if (currentTask.status === 'pending') {
      // 只在第一次执行时设定开始时间
      if (!currentTask.startTime || currentTask.startTime === 0) {
        currentTask.startTime = now;
        updateCraftingProgress(currentTask.id, 0);
      }
    }

    // 基于Factorio机制计算制作时间
    const craftingTime = this.calculateCraftingTime(recipe, currentTask.quantity) * 1000; // 转换为毫秒
    const elapsed = now - currentTask.startTime;
    const progress = Math.min((elapsed / craftingTime) * 100, 100);

    updateCraftingProgress(currentTask.id, progress);

    // 检查是否完成
    if (progress >= 100) {
      this.completeCraft(currentTask, recipe);
    }
  }

  /**
   * 计算制作时间 - 使用 CraftingEngine 的业务逻辑
   */
  private calculateCraftingTime(recipe: Recipe, quantity: number): number {
    return this.craftingEngine.calculateCraftingTime(recipe, quantity);
  }

  /**
   * 完成常规制作
   */
  private completeCraft(task: CraftingTask, recipe: Recipe): void {
    const { updateInventory, completeCraftingTask, trackMinedEntity } = useGameStore.getState();

    // 1. 先消耗输入材料（链式任务的原材料已在创建时扣除，这里只扣除中间产物）
    if (recipe.in && !task.chainId) {
      // 非链式任务才扣除材料
      Object.entries(recipe.in).forEach(([itemId, required]) => {
        const totalRequired = (required as number) * task.quantity;
        updateInventory(itemId, -totalRequired);
      });
    }

    // 2. 计算生产力加成后的产出
    const productivityBonus = this.calculateProductivityBonus(recipe);
    const bonusMultiplier = 1 + productivityBonus;

    // 3. 添加产品到库存（包含生产力加成）
    Object.entries(recipe.out).forEach(([itemId, quantity]) => {
      const baseQuantity = (quantity as number) * task.quantity;
      const bonusQuantity = Math.floor(baseQuantity * bonusMultiplier);
      updateInventory(itemId, bonusQuantity);

      // 4. 如果是采矿配方，追踪挖掘的实体（用于研究触发器）
      if (recipe.flags?.includes('mining')) {
        trackMinedEntity(itemId, bonusQuantity);
      }
    });

    // 5. 完成任务
    completeCraftingTask(task.id);
  }

  /**
   * 完成手动制作
   */
  private completeManualCraft(task: CraftingTask, recipe: Recipe | null): void {
    const { updateInventory, completeCraftingTask, trackMinedEntity } = useGameStore.getState();

    if (recipe) {
      // 有配方的情况，正常处理输入输出
      if (recipe.in) {
        // 消耗输入材料
        Object.entries(recipe.in).forEach(([itemId, required]) => {
          const totalRequired = (required as number) * task.quantity;
          updateInventory(itemId, -totalRequired);
        });
      }

      // 添加产品到库存
      Object.entries(recipe.out).forEach(([itemId, quantity]) => {
        const totalQuantity = (quantity as number) * task.quantity;
        updateInventory(itemId, totalQuantity);

        // 如果是采矿配方，追踪挖掘的实体
        if (recipe.flags?.includes('mining')) {
          trackMinedEntity(itemId, totalQuantity);
        }
      });
    } else {
      // 没有配方的情况（原材料），直接添加到库存
      updateInventory(task.itemId, task.quantity);
    }

    // 完成任务
    completeCraftingTask(task.id);
  }

  /**
   * 计算生产力加成 - 使用 CraftingEngine 的业务逻辑
   */
  private calculateProductivityBonus(recipe: Recipe): number {
    return this.craftingEngine.getProductivityBonus(recipe);
  }
}

export default MainGameLoop;