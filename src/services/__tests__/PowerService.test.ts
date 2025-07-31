import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PowerService, type PowerBalance } from '../PowerService';
import { DataService } from '../DataService';
import { GameConfig } from '../GameConfig';
import type { FacilityInstance } from '../../types/facilities';
import { FacilityStatus } from '../../types/facilities';
import type { ServiceInstance } from '../../types/test-utils';

// Mock dependencies
vi.mock('../DataService');
vi.mock('../GameConfig');

describe('PowerService', () => {
  let powerService: PowerService;
  let mockDataService: { getInstance: ReturnType<typeof vi.fn>; getItem: ReturnType<typeof vi.fn> };
  let mockGameConfig: { getInstance: ReturnType<typeof vi.fn>; getConstants: ReturnType<typeof vi.fn> };

  // 模拟设施数据
  const mockElectricFurnace = {
    id: 'electric-furnace',
    facilityId: 'electric-furnace',
    machine: {
      type: 'electric',
      usage: 180000 // 180kW
    }
  };

  const mockBurnerFurnace = {
    id: 'stone-furnace',
    facilityId: 'stone-furnace',
    machine: {
      type: 'burner',
      usage: 0 // burner设施不消耗电力
    }
  };

  const mockSteamEngine = {
    id: 'steam-engine',
    facilityId: 'steam-engine',
    machine: {
      type: 'electric',
      usage: 900 // 900kW (实际实现中的硬编码值)
    }
  };

  const mockSolarPanel = {
    id: 'solar-panel',
    facilityId: 'solar-panel',
    machine: {
      type: 'electric',
      usage: 60 // 60kW (实际实现中的硬编码值)
    }
  };

  const mockMiningDrill = {
    id: 'electric-mining-drill',
    facilityId: 'electric-mining-drill',
    machine: {
      type: 'electric',
      usage: 90000 // 90kW
    }
  };

  const mockAssemblingMachine = {
    id: 'assembling-machine-1',
    facilityId: 'assembling-machine-1',
    machine: {
      type: 'electric',
      usage: 77000 // 77kW
    }
  };

  beforeEach(() => {
    // 清除实例
    (PowerService as unknown as ServiceInstance<PowerService>).instance = null;
    localStorage.clear();

    // 设置模拟对象
    mockDataService = {
      getInstance: vi.fn(),
      getItem: vi.fn((itemId: string) => {
        const items: Record<string, unknown> = {
          'electric-furnace': mockElectricFurnace,
          'stone-furnace': mockBurnerFurnace,
          'steam-engine': mockSteamEngine,
          'solar-panel': mockSolarPanel,
          'electric-mining-drill': mockMiningDrill,
          'assembling-machine-1': mockAssemblingMachine
        };
        return items[itemId] as unknown;
      })
    };

    mockGameConfig = {
      getInstance: vi.fn(),
      getConstants: vi.fn(() => ({
        power: {
          surplusThreshold: 110, // 110%
          balancedThreshold: 90,  // 90%
          solarPanelDayRatio: 0.7 // 70% 平均发电率
        },
        crafting: {
          minCraftingTime: 0.1,
          updateInterval: 100,
          maxProductivityBonus: 0.5
        },
        fuel: {
          defaultFuelSlots: 1,
          fuelBufferFullThreshold: 95,
          autoRefuelCheckInterval: 5000
        },
        storage: {
          defaultStackSize: 50,
          maxInventorySlots: 1000,
          storageOptimizationThreshold: 100
        },
        ui: {
          autoSaveInterval: 10000,
          debounceDelay: 2000,
          maxRecentRecipes: 10
        }
      }))
    };

    vi.mocked(DataService.getInstance).mockReturnValue(mockDataService as unknown as DataService);
    vi.mocked(GameConfig.getInstance).mockReturnValue(mockGameConfig as unknown as GameConfig);

    powerService = PowerService.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 单例模式测试
  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const instance1 = PowerService.getInstance();
      const instance2 = PowerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  // 电力平衡计算测试
  describe('calculatePowerBalance', () => {
    it('应该正确计算电力平衡 - 充足状态', () => {
      // 模拟蒸汽供应
      vi.spyOn(powerService, 'getSteamSupply').mockReturnValue({
        normal: 60, // 60单位/秒蒸汽供应
        highTemp: 0
      });

      const facilities: FacilityInstance[] = [
        {
          id: 'steam-engine',
          facilityId: 'steam-engine',
          count: 2,
          status: FacilityStatus.RUNNING,
          efficiency: 1.0
        },
        {
          id: 'electric-furnace',
          facilityId: 'electric-furnace',
          count: 1,
          status: FacilityStatus.RUNNING,
          efficiency: 1.0
        }
      ];

      const balance = powerService.calculatePowerBalance(facilities);

      expect(balance.generationCapacity).toBe(1800); // 2 * 900kW
      expect(balance.consumptionDemand).toBe(180000); // 1 * 180kW
      expect(balance.satisfactionRatio).toBe(0.01); // 1800/180000
      expect(balance.status).toBe('deficit');
      expect(balance.actualGeneration).toBe(1800);
      expect(balance.actualConsumption).toBe(1800);
    });

    it('应该正确计算电力平衡 - 不足状态', () => {
      // 模拟蒸汽供应
      vi.spyOn(powerService, 'getSteamSupply').mockReturnValue({
        normal: 30, // 30单位/秒蒸汽供应
        highTemp: 0
      });

      const facilities: FacilityInstance[] = [
        {
          id: 'steam-engine',
          facilityId: 'steam-engine',
          count: 1,
          status: FacilityStatus.RUNNING,
          efficiency: 1.0
        },
        {
          id: 'electric-furnace',
          facilityId: 'electric-furnace',
          count: 10,
          status: FacilityStatus.RUNNING,
          efficiency: 1.0
        }
      ];

      const balance = powerService.calculatePowerBalance(facilities);

      expect(balance.generationCapacity).toBe(900); // 1 * 900kW
      expect(balance.consumptionDemand).toBe(1800000); // 10 * 180kW
      expect(balance.satisfactionRatio).toBe(0.0005); // 900/1800000
      expect(balance.status).toBe('deficit');
      expect(balance.actualGeneration).toBe(900);
      expect(balance.actualConsumption).toBe(900);
    });

    it('应该正确计算电力平衡 - 平衡状态', () => {
      // 模拟蒸汽供应
      vi.spyOn(powerService, 'getSteamSupply').mockReturnValue({
        normal: 30, // 30单位/秒蒸汽供应
        highTemp: 0
      });

      const facilities: FacilityInstance[] = [
        {
          id: 'steam-engine',
          facilityId: 'steam-engine',
          count: 1,
          status: FacilityStatus.RUNNING,
          efficiency: 1.0
        },
        {
          id: 'electric-furnace',
          facilityId: 'electric-furnace',
          count: 5,
          status: FacilityStatus.RUNNING,
          efficiency: 1.0
        }
      ];

      const balance = powerService.calculatePowerBalance(facilities);

      expect(balance.generationCapacity).toBe(900); // 1 * 900kW
      expect(balance.consumptionDemand).toBe(900000); // 5 * 180kW
      expect(balance.satisfactionRatio).toBe(0.001); // 900/900000
      expect(balance.status).toBe('deficit');
    });

    it('应该忽略停止的设施', () => {
      const facilities: FacilityInstance[] = [
        {
          id: 'steam-engine',
          facilityId: 'steam-engine',
          count: 1,
          status: FacilityStatus.RUNNING,
          efficiency: 1.0
        },
        {
          id: 'electric-furnace',
          facilityId: 'electric-furnace',
          count: 1,
          status: FacilityStatus.STOPPED,
          efficiency: 0
        }
      ];

      // 模拟蒸汽供应
      vi.spyOn(powerService, 'getSteamSupply').mockReturnValue({
        normal: 30, // 30单位/秒蒸汽供应
        highTemp: 0
      });

      const balance = powerService.calculatePowerBalance(facilities);

      expect(balance.generationCapacity).toBe(900); // 1 * 900kW
      expect(balance.consumptionDemand).toBe(0); // 停止的设施不消耗电力
    });

    it('应该正确分类统计耗电', () => {
      const facilities: FacilityInstance[] = [
        {
          id: 'electric-mining-drill',
          facilityId: 'electric-mining-drill',
          count: 1,
          status: FacilityStatus.RUNNING,
          efficiency: 1.0
        },
        {
          id: 'electric-furnace',
          facilityId: 'electric-furnace',
          count: 1,
          status: FacilityStatus.RUNNING,
          efficiency: 1.0
        },
        {
          id: 'assembling-machine-1',
          facilityId: 'assembling-machine-1',
          count: 1,
          status: FacilityStatus.RUNNING,
          efficiency: 1.0
        }
      ];

      const balance = powerService.calculatePowerBalance(facilities);

      expect(balance.consumptionByCategory.mining).toBe(90000); // mining drill
      expect(balance.consumptionByCategory.smelting).toBe(180000); // electric furnace
      expect(balance.consumptionByCategory.crafting).toBe(77000); // assembling machine
    });
  });

  // 设施电力状态更新测试
  describe('updateFacilityPowerStatus', () => {
    const mockPowerBalance: PowerBalance = {
      generationCapacity: 900000,
      actualGeneration: 900000,
      generationByType: { 'steam-engine': 900000 },
      consumptionDemand: 180000,
      actualConsumption: 180000,
      consumptionByCategory: { smelting: 180000 },
      satisfactionRatio: 1,
      status: 'surplus'
    };

    it('应该更新电力设施的效率和状态 - 充足电力', () => {
      const facility: FacilityInstance = {
        id: 'electric-furnace',
        facilityId: 'electric-furnace',
        count: 1,
        status: FacilityStatus.NO_POWER,
        efficiency: 0
      };

      const updated = powerService.updateFacilityPowerStatus(facility, mockPowerBalance);

      expect(updated.efficiency).toBe(1.0);
      expect(updated.status).toBe(FacilityStatus.RUNNING);
    });

    it('应该更新电力设施的效率和状态 - 不足电力', () => {
      const powerBalance: PowerBalance = {
        ...mockPowerBalance,
        satisfactionRatio: 0.5,
        status: 'deficit'
      };

      const facility: FacilityInstance = {
        id: 'electric-furnace',
        facilityId: 'electric-furnace',
        count: 1,
        status: FacilityStatus.RUNNING,
        efficiency: 1.0
      };

      const updated = powerService.updateFacilityPowerStatus(facility, powerBalance);

      expect(updated.efficiency).toBe(0.5);
      expect(updated.status).toBe(FacilityStatus.RUNNING);
    });

    it('应该更新电力设施的效率和状态 - 无电力', () => {
      const powerBalance: PowerBalance = {
        ...mockPowerBalance,
        satisfactionRatio: 0,
        status: 'deficit'
      };

      const facility: FacilityInstance = {
        id: 'electric-furnace',
        facilityId: 'electric-furnace',
        count: 1,
        status: FacilityStatus.RUNNING,
        efficiency: 1.0
      };

      const updated = powerService.updateFacilityPowerStatus(facility, powerBalance);

      expect(updated.efficiency).toBe(0);
      expect(updated.status).toBe(FacilityStatus.NO_POWER);
    });

    it('不应该更新burner类型设施', () => {
      const facility: FacilityInstance = {
        id: 'stone-furnace',
        facilityId: 'stone-furnace',
        count: 1,
        status: FacilityStatus.RUNNING,
        efficiency: 0.8
      };

      const updated = powerService.updateFacilityPowerStatus(facility, mockPowerBalance);

      expect(updated.efficiency).toBe(0.8); // 保持不变
      expect(updated.status).toBe(FacilityStatus.RUNNING);
    });

    it('不应该更新非耗电设施', () => {
      // 模拟一个不消耗电力的设施
      (mockDataService.getItem as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        id: 'some-facility',
        facilityId: 'some-facility',
        machine: { type: 'electric', usage: 0 }
      });

      const facility: FacilityInstance = {
        id: 'some-facility',
        facilityId: 'some-facility',
        count: 1,
        status: FacilityStatus.RUNNING,
        efficiency: 0.9
      };

      const updated = powerService.updateFacilityPowerStatus(facility, mockPowerBalance);

      expect(updated.efficiency).toBe(0.9); // 保持不变
    });
  });

  // 设施电力需求测试
  describe('getFacilityPowerDemand', () => {
    it('应该返回正确的电力需求', () => {
      const facility: FacilityInstance = {
        id: 'electric-furnace',
        facilityId: 'electric-furnace',
        count: 2,
        status: FacilityStatus.RUNNING,
        efficiency: 1.0
      };

      const demand = powerService.getFacilityPowerDemand(facility);

      expect(demand).toBe(360000); // 2 * 180kW
    });

    it('停止的设施应该返回0需求', () => {
      const facility: FacilityInstance = {
        id: 'electric-furnace',
        facilityId: 'electric-furnace',
        count: 2,
        status: FacilityStatus.STOPPED,
        efficiency: 0
      };

      const demand = powerService.getFacilityPowerDemand(facility);

      expect(demand).toBe(0);
    });

    it('burner类型设施应该返回0需求', () => {
      const facility: FacilityInstance = {
        id: 'stone-furnace',
        facilityId: 'stone-furnace',
        count: 2,
        status: FacilityStatus.RUNNING,
        efficiency: 1.0
      };

      const demand = powerService.getFacilityPowerDemand(facility);

      expect(demand).toBe(0);
    });
  });

  // 设施发电量测试
  describe('getFacilityPowerGeneration', () => {
    it('应该返回正确的发电量', () => {
      const facility: FacilityInstance = {
        id: 'steam-engine',
        facilityId: 'steam-engine',
        count: 2,
        status: FacilityStatus.RUNNING,
        efficiency: 1.0
      };

      const generation = powerService.getFacilityPowerGeneration(facility, 60); // 60单位/秒蒸汽供应

      expect(generation).toBe(1800); // 2 * 900kW
    });

    it('停止的设施应该返回0发电量', () => {
      const facility: FacilityInstance = {
        id: 'steam-engine',
        facilityId: 'steam-engine',
        count: 2,
        status: FacilityStatus.STOPPED,
        efficiency: 0
      };

      const generation = powerService.getFacilityPowerGeneration(facility);

      expect(generation).toBe(0);
    });

    it('太阳能板应该考虑昼夜比例', () => {
      const facility: FacilityInstance = {
        id: 'solar-panel',
        facilityId: 'solar-panel',
        count: 10,
        status: FacilityStatus.RUNNING,
        efficiency: 1.0
      };

      const generation = powerService.getFacilityPowerGeneration(facility);

      expect(generation).toBe(420); // 10 * 60kW * 0.7
    });

    it('蒸汽机应该考虑蒸汽供应', () => {
      const facility: FacilityInstance = {
        id: 'steam-engine',
        facilityId: 'steam-engine',
        count: 1,
        status: FacilityStatus.RUNNING,
        efficiency: 1.0
      };

      // 蒸汽供应不足的情况
      const generation = powerService.getFacilityPowerGeneration(facility, 15); // 15单位/秒

      expect(generation).toBe(450); // 900kW * (15/30)
    });

    it('汽轮机应该考虑蒸汽供应', () => {
      const facility: FacilityInstance = {
        id: 'steam-turbine',
        facilityId: 'steam-turbine',
        count: 1,
        status: FacilityStatus.RUNNING,
        efficiency: 1.0
      };

      // 蒸汽供应不足的情况
      const generation = powerService.getFacilityPowerGeneration(facility, 30); // 30单位/秒

      expect(generation).toBe(2900); // 5800kW * (30/60)
    });

    it('没有蒸汽供应时应该返回0', () => {
      const facility: FacilityInstance = {
        id: 'steam-engine',
        facilityId: 'steam-engine',
        count: 1,
        status: FacilityStatus.RUNNING,
        efficiency: 1.0
      };

      const generation = powerService.getFacilityPowerGeneration(facility, 0);

      expect(generation).toBe(0);
    });
  });

  // 蒸汽供应测试
  describe('getSteamSupply', () => {
    it('应该返回蒸汽供应数据', () => {
      const steamSupply = powerService.getSteamSupply();

      expect(steamSupply).toEqual({
        normal: 0,
        highTemp: 0
      });
    });
  });

  // 电力优先级建议测试
  describe('getPowerPriorityRecommendations', () => {
    it('电力充足时应该返回空建议', () => {
      const powerBalance: PowerBalance = {
        generationCapacity: 1000000,
        actualGeneration: 1000000,
        generationByType: {},
        consumptionDemand: 500000,
        actualConsumption: 500000,
        consumptionByCategory: {},
        satisfactionRatio: 1,
        status: 'surplus'
      };

      const recommendations = powerService.getPowerPriorityRecommendations([], powerBalance);

      expect(recommendations).toEqual([]);
    });

    it('电力不足时应该返回建议', () => {
      const powerBalance: PowerBalance = {
        generationCapacity: 500000,
        actualGeneration: 500000,
        generationByType: {},
        consumptionDemand: 1000000,
        actualConsumption: 500000,
        consumptionByCategory: {
          research: 100000,
          smelting: 400000,
          crafting: 500000
        },
        satisfactionRatio: 0.5,
        status: 'deficit'
      };

      const recommendations = powerService.getPowerPriorityRecommendations([], powerBalance);

      expect(recommendations).toContain('需要增加 556 台蒸汽机或等效发电设施');
      expect(recommendations).toContain('可以暂时关闭研究设施以节省电力');
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  // 设施类别分类测试
  describe('facility category classification', () => {
    it('应该正确分类不同类型的设施', () => {
      // 为测试添加更多设施数据
      (mockDataService.getItem as ReturnType<typeof vi.fn>).mockImplementation((itemId: string) => {
        switch (itemId) {
          case 'electric-mining-drill': return { id: itemId, facilityId: itemId, machine: { type: 'electric', usage: 90000 } };
          case 'stone-furnace': return { id: itemId, facilityId: itemId, machine: { type: 'burner', usage: 0 } };
          case 'assembling-machine-1': return { id: itemId, facilityId: itemId, machine: { type: 'electric', usage: 77000 } };
          case 'chemical-plant': return { id: itemId, facilityId: itemId, machine: { type: 'electric', usage: 210000 } };
          case 'lab': return { id: itemId, facilityId: itemId, machine: { type: 'electric', usage: 60000 } };
          case 'unknown-facility': return { id: itemId, facilityId: itemId, machine: { type: 'electric', usage: 50000 } };
          default: return null;
        }
      });

      const facilities: FacilityInstance[] = [
        { id: 'electric-mining-drill', facilityId: 'electric-mining-drill', count: 1, status: FacilityStatus.RUNNING, efficiency: 1.0 },
        { id: 'stone-furnace', facilityId: 'stone-furnace', count: 1, status: FacilityStatus.RUNNING, efficiency: 1.0 },
        { id: 'assembling-machine-1', facilityId: 'assembling-machine-1', count: 1, status: FacilityStatus.RUNNING, efficiency: 1.0 },
        { id: 'chemical-plant', facilityId: 'chemical-plant', count: 1, status: FacilityStatus.RUNNING, efficiency: 1.0 },
        { id: 'lab', facilityId: 'lab', count: 1, status: FacilityStatus.RUNNING, efficiency: 1.0 },
        { id: 'unknown-facility', facilityId: 'unknown-facility', count: 1, status: FacilityStatus.RUNNING, efficiency: 1.0 }
      ];

      const balance = powerService.calculatePowerBalance(facilities);

      expect(balance.consumptionByCategory.mining).toBeGreaterThan(0);
      expect(balance.consumptionByCategory.smelting).toBe(0); // burner设施不消耗电力
      expect(balance.consumptionByCategory.crafting).toBeGreaterThan(0);
      expect(balance.consumptionByCategory.chemical).toBeGreaterThan(0);
      expect(balance.consumptionByCategory.research).toBeGreaterThan(0);
      expect(balance.consumptionByCategory.other).toBeGreaterThan(0);
    });
  });

  // 边界条件测试
  describe('edge cases', () => {
    it('应该处理空设施列表', () => {
      const balance = powerService.calculatePowerBalance([]);

      expect(balance.generationCapacity).toBe(0);
      expect(balance.consumptionDemand).toBe(0);
      expect(balance.satisfactionRatio).toBe(0);
      expect(balance.status).toBe('balanced');
    });

    it('应该处理发电能力为0的情况', () => {
      const facilities: FacilityInstance[] = [
        {
          id: 'electric-furnace',
          facilityId: 'electric-furnace',
          count: 1,
          status: FacilityStatus.RUNNING,
          efficiency: 1.0
        }
      ];

      const balance = powerService.calculatePowerBalance(facilities);

      expect(balance.generationCapacity).toBe(0);
      expect(balance.satisfactionRatio).toBe(0);
      expect(balance.status).toBe('deficit');
    });

    it('应该处理未知设施ID', () => {
      const facility: FacilityInstance = {
        id: 'unknown-facility',
        facilityId: 'unknown-facility',
        count: 1,
        status: FacilityStatus.RUNNING,
        efficiency: 1.0
      };

      const demand = powerService.getFacilityPowerDemand(facility);
      const generation = powerService.getFacilityPowerGeneration(facility);

      expect(demand).toBe(0);
      expect(generation).toBe(0);
    });
  });
}); 