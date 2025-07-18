import { GameData, Item, InventoryItem, CraftingTask } from '../types';

class DataService {
  private gameData: GameData | null = null;
  private inventory: Map<string, InventoryItem> = new Map();
  private craftingQueue: CraftingTask[] = [];

  async loadGameData(): Promise<GameData> {
    if (this.gameData) {
      return this.gameData;
    }

    try {
      const response = await fetch('/data/1.1/data.json');
      this.gameData = await response.json();
      this.initializeInventory();
      return this.gameData!;
    } catch (error) {
      console.error('Failed to load game data:', error);
      throw error;
    }
  }

  private initializeInventory() {
    if (!this.gameData) return;

    // 初始化一些示例物品库存
    const sampleItems = [
      { id: 'iron-ore', amount: 150, rate: 2.5 },
      { id: 'copper-ore', amount: 200, rate: 1.8 },
      { id: 'coal', amount: 300, rate: 3.2 },
      { id: 'iron-plate', amount: 245, rate: 1.5 },
      { id: 'copper-plate', amount: 180, rate: 1.2 },
      { id: 'iron-gear-wheel', amount: 50, rate: 0.8 },
      { id: 'electronic-circuit', amount: 32, rate: 0.5 },
      { id: 'transport-belt', amount: 100, rate: 2.0 },
      { id: 'inserter', amount: 25, rate: 0.3 },
      { id: 'small-electric-pole', amount: 15, rate: 0.2 },
    ];

    sampleItems.forEach(item => {
      this.inventory.set(item.id, {
        itemId: item.id,
        currentAmount: item.amount,
        maxCapacity: 1000,
        productionRate: item.rate,
        consumptionRate: Math.random() * 0.5,
        status: Math.random() > 0.7 ? 'producing' : 'normal'
      });
    });
  }

  getItemsByCategory(categoryId: string): Item[] {
    if (!this.gameData) return [];
    
    return this.gameData.items?.filter(item => 
      item.category === categoryId
    ) || [];
  }

  getItemIcon(itemId: string): string {
    if (!this.gameData) return '';
    
    const icon = this.gameData.icons.find(icon => icon.id === itemId);
    return icon ? `/data/1.1/icons.webp` : '';
  }

  getItemIconPosition(itemId: string): string {
    if (!this.gameData) return '0px 0px';
    
    const icon = this.gameData.icons.find(icon => icon.id === itemId);
    return icon?.position || '0px 0px';
  }

  getItemIconColor(itemId: string): string {
    if (!this.gameData) return '#666';
    
    const icon = this.gameData.icons.find(icon => icon.id === itemId);
    return icon?.color || '#666';
  }

  getInventoryItem(itemId: string): InventoryItem | null {
    return this.inventory.get(itemId) || null;
  }

  getAllInventoryItems(): InventoryItem[] {
    return Array.from(this.inventory.values());
  }

  updateInventory(itemId: string, changes: Partial<InventoryItem>) {
    const current = this.inventory.get(itemId);
    if (current) {
      this.inventory.set(itemId, { ...current, ...changes });
    }
  }

  // 制作队列管理
  addToCraftingQueue(itemId: string, quantity: number = 1): boolean {
    if (this.craftingQueue.length >= 10) {
      return false; // 队列已满
    }

    const task: CraftingTask = {
      id: `${itemId}-${Date.now()}-${Math.random()}`,
      itemId,
      quantity,
      progress: 0,
      totalTime: 5, // 默认5秒制作时间
      status: 'waiting',
      startTime: Date.now()
    };

    this.craftingQueue.push(task);
    return true;
  }

  getCraftingQueue(): CraftingTask[] {
    return [...this.craftingQueue];
  }

  removeCraftingTask(taskId: string): boolean {
    const index = this.craftingQueue.findIndex(task => task.id === taskId);
    if (index !== -1) {
      this.craftingQueue.splice(index, 1);
      return true;
    }
    return false;
  }

  // 模拟制作进度更新
  updateCraftingProgress() {
    const now = Date.now();
    
    this.craftingQueue.forEach(task => {
      if (task.status === 'in_progress') {
        const elapsed = (now - task.startTime) / 1000;
        task.progress = Math.min(elapsed / task.totalTime, 1);
        
        if (task.progress >= 1) {
          // 制作完成
          const inventoryItem = this.getInventoryItem(task.itemId);
          if (inventoryItem) {
            this.updateInventory(task.itemId, {
              currentAmount: inventoryItem.currentAmount + task.quantity
            });
          }
          this.removeCraftingTask(task.id);
        }
      } else if (task.status === 'waiting' && this.craftingQueue[0]?.id === task.id) {
        // 开始制作队列中的第一个任务
        task.status = 'in_progress';
        task.startTime = now;
      }
    });
  }

  startCraftingSimulation() {
    setInterval(() => {
      this.updateCraftingProgress();
    }, 100);
  }
}

export const dataService = new DataService(); 