import GameConfig from '@/services/core/GameConfig';
import { FuelService, type GenericFuelBuffer } from '@/services/crafting/FuelService';
import type { FacilityInstance } from '@/types/facilities';
import { beforeEach, describe, expect, it } from 'vitest';

// 简化的假数据服务
interface MockItem {
  id: string;
  machine?: {
    type: string;
    usage?: number;
    fuelCategories?: string[];
    entityType?: string;
  };
  fuel?: {
    value: number;
    category?: string;
  };
  stack?: number;
}

class MockDataService {
  private items: Record<string, MockItem>;
  constructor(items: Record<string, MockItem>) {
    this.items = items;
  }
  // 覆盖直接返回
  getItem(id: string): MockItem | undefined {
    return this.items[id];
  }
}

// 构造基础环境
const makeEnv = () => {
  const items: Record<string, MockItem> = {
    'stone-furnace': {
      id: 'stone-furnace',
      machine: { type: 'burner', usage: 90, fuelCategories: ['chemical'], entityType: 'furnace' },
    },
    'burner-mining-drill': {
      id: 'burner-mining-drill',
      machine: {
        type: 'burner',
        usage: 90,
        fuelCategories: ['chemical'],
        entityType: 'mining-drill',
      },
    },
    coal: { id: 'coal', fuel: { value: 4, category: 'chemical' } },
  };
  const dataService = new MockDataService(items);
  const gameConfig = new GameConfig(dataService as unknown as never);
  const recipeService: { getRecipeById: (id: string) => undefined } = {
    getRecipeById: () => undefined,
  };
  const fuelService = new FuelService(
    dataService as unknown as never,
    gameConfig,
    recipeService as unknown as never
  );
  return { fuelService };
};

// 生成一个带燃料的缓存
const makeBuffer = (facilityId: string, fuelService: FuelService): GenericFuelBuffer => {
  const buffer = fuelService.initializeFuelBuffer(facilityId)!;
  fuelService.addFuel(buffer, 'coal', 2, facilityId); // 加入2个煤：总能量 ~ 8 MJ
  return buffer;
};

describe('FuelService basics', () => {
  beforeEach(() => {
    // 清理localStorage模拟
    if (typeof localStorage !== 'undefined') localStorage.clear();
  });

  it('calculates fuel status with correct maxEnergy and progress', () => {
    const { fuelService } = makeEnv();
    const buffer = makeBuffer('stone-furnace', fuelService);

    const status1 = fuelService.getFuelStatus(buffer);
    expect(status1.totalEnergy).toBeGreaterThan(0);
    // progress 应在(0,100]
    expect(status1.burnProgress).toBeGreaterThan(0);
    expect(status1.burnProgress).toBeLessThanOrEqual(100);
    // maxEnergy 应使用设施配置(50堆叠) * 单块煤能量4MJ = 200MJ
    expect(status1.maxEnergy).toBe(200);
    expect(status1.fillPercentage).toBeGreaterThan(0);
  });

  it('consumes fuel using ms delta in task and internal seconds conversion', () => {
    const { fuelService } = makeEnv();
    const buffer = makeBuffer('stone-furnace', fuelService);

    const facility: FacilityInstance = {
      id: 'f1',
      facilityId: 'stone-furnace',
      count: 1,
      status: 'running',
      efficiency: 1,
      fuelBuffer: buffer,
      production: { currentRecipeId: 'r', progress: 0, inputBuffer: [], outputBuffer: [] },
    };

    // 模拟1秒(ms)——按照实现会 msToSeconds(1000) => 1 秒
    const before = fuelService.getFuelStatus(buffer).totalEnergy;
    const result = fuelService.updateFuelConsumption(facility, 1000, true);
    expect(result.success).toBe(true);
    const after = fuelService.getFuelStatus(buffer).totalEnergy;
    // 90kW * 1s = 0.09 MJ，能量应减少
    expect(after).toBeLessThan(before);
    expect(Math.abs(before - after - 0.09)).toBeLessThan(0.001);
  });

  it('respects user-set fuel priority persisted to localStorage', () => {
    const { fuelService } = makeEnv();
    const priority = ['wood', 'coal'];
    fuelService.setFuelPriority(priority);
    const got = fuelService.getFuelPriority();
    expect(got[0]).toBe('wood');
  });
});

// 智能燃料分配（短缺场景）
describe('FuelService smart distribution (shortage fairness)', () => {
  const makeFacility = (id: string, facilityId: string): FacilityInstance => ({
    id,
    facilityId,
    count: 1,
    status: 'running',
    efficiency: 1,
    fuelBuffer: {
      facilityId,
      slots: [{ itemId: '', quantity: 0, remainingEnergy: 0 }],
      totalEnergy: 0,
      burnRate: 90,
    } as unknown as GenericFuelBuffer,
  });

  it('distributes 1 fuel per high-priority facility under shortage', () => {
    const { fuelService } = makeEnv();

    const facilities: FacilityInstance[] = [
      makeFacility('f1', 'burner-mining-drill'), // 高优先级
      makeFacility('f2', 'stone-furnace'), // 次高
    ];

    const inventory: Record<string, { currentAmount: number }> = { coal: { currentAmount: 1 } };
    const getInventoryItem = (itemId: string): { currentAmount: number } =>
      inventory[itemId] || { currentAmount: 0 };
    const updateInventory = (itemId: string, amount: number): void => {
      if (!inventory[itemId]) inventory[itemId] = { currentAmount: 0 };
      inventory[itemId].currentAmount += amount;
    };

    fuelService.smartFuelDistribution(facilities, getInventoryItem, updateInventory);

    // 由于短缺（仅1个煤），应优先给予采矿机
    expect(facilities[0].fuelBuffer?.slots[0].itemId).toBe('coal');
    expect(facilities[0].fuelBuffer?.slots[0].quantity).toBe(1);
    expect(facilities[1].fuelBuffer?.slots[0].itemId).toBe('');
    expect(inventory.coal.currentAmount).toBe(0);
  });
});
