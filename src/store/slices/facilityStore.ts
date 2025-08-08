// 设施管理切片
import type { DataService } from '@/services/core/DataService';
import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';
import type { FuelService } from '@/services/crafting/FuelService';
import type { FacilitySlice, SliceCreator } from '@/store/types';

export const createFacilitySlice: SliceCreator<FacilitySlice> = (set, get) => ({
  // 初始状态
  facilities: [],

  // 设施管理
  addFacility: facility => {
    const fuelService = getService<FuelService>(SERVICE_TOKENS.FUEL_SERVICE);

    // 检查是否需要燃料缓存
    const fuelBuffer = fuelService.initializeFuelBuffer(facility.facilityId);
    if (fuelBuffer) {
      facility.fuelBuffer = fuelBuffer;
    }

    set(state => ({
      facilities: [...state.facilities, facility],
    }));

    // 追踪建造的实体（用于研究触发器）
    get().trackBuiltEntity(facility.facilityId, 1);
  },

  updateFacility: (facilityId: string, updates) => {
    set(state => ({
      facilities: state.facilities.map(facility =>
        facility.id === facilityId ? { ...facility, ...updates } : facility
      ),
    }));
  },

  removeFacility: (facilityId: string) => {
    const facility = get().facilities.find(f => f.id === facilityId);
    if (facility) {
      // 如果设施正在生产且有进度，返还已消耗的材料
      get().handleFacilityProductionCancellation(facility);
    }

    set(state => ({
      facilities: state.facilities.filter(facility => facility.id !== facilityId),
    }));
  },

  // 停止设施生产
  stopFacilityProduction: (facilityId: string) => {
    const facility = get().facilities.find(f => f.id === facilityId);
    if (facility && facility.status === 'running') {
      // 返还已消耗的材料
      get().handleFacilityProductionCancellation(facility);

      // 重置生产状态
      get().updateFacility(facilityId, {
        status: 'stopped',
        production: facility.production
          ? {
              ...facility.production,
              progress: 0,
            }
          : undefined,
      });
    }
  },

  // 处理设施生产取消的材料返还
  handleFacilityProductionCancellation: facility => {
    const production = facility.production;
    if (!production?.currentRecipeId || !production.progress || production.progress === 0) {
      return; // 没有进行中的生产，无需返还
    }

    const dataService = getService<DataService>(SERVICE_TOKENS.DATA_SERVICE);
    const recipe = dataService.getRecipe(production.currentRecipeId);
    if (!recipe?.in) {
      return; // 没有输入材料，无需返还
    }

    console.log(`[Facility] 设施 ${facility.id} 生产取消，返还材料`);

    // 返还已消耗的输入材料
    Object.entries(recipe.in).forEach(([itemId, quantity]) => {
      get().updateInventory(itemId, quantity as number);
      console.log(`[Facility] 返还 ${itemId} x${quantity}`);
    });
  },

  _repairFacilityState: () => {
    const facilities = get().facilities;
    const dataService = getService<DataService>(SERVICE_TOKENS.DATA_SERVICE);
    const needsRepair = facilities.filter(
      facility => !facility.targetItemId && facility.production?.currentRecipeId
    );

    if (needsRepair.length > 0) {
      set(state => ({
        facilities: state.facilities.map(facility => {
          if (!facility.targetItemId && facility.production?.currentRecipeId) {
            const recipe = dataService.getRecipe(facility.production.currentRecipeId);
            if (recipe && recipe.out) {
              // 从配方的输出物品中找到第一个作为目标物品
              const targetItemId = Object.keys(recipe.out)[0];
              console.log(`Repaired facility ${facility.id}: targetItemId set to ${targetItemId}`);
              return { ...facility, targetItemId };
            }
          }
          return facility;
        }),
      }));
    }
  },

  // 燃料系统方法
  refuelFacility: (facilityId: string, fuelItemId: string, quantity: number) => {
    const facility = get().facilities.find(f => f.id === facilityId);
    if (!facility?.fuelBuffer) return false;

    const fuelService = getService<FuelService>(SERVICE_TOKENS.FUEL_SERVICE);
    const result = fuelService.addFuel(
      facility.fuelBuffer,
      fuelItemId,
      quantity,
      facility.facilityId
    );

    if (result.success && result.quantityAdded) {
      // 从库存扣除
      get().updateInventory(fuelItemId, -result.quantityAdded);

      // 更新设施
      get().updateFacility(facilityId, { fuelBuffer: facility.fuelBuffer });

      return true;
    }

    return false;
  },

  autoRefuelFacilities: () => {
    const fuelService = getService<FuelService>(SERVICE_TOKENS.FUEL_SERVICE);
    const facilities = get().facilities;

    // 使用智能燃料分配
    fuelService.smartFuelDistribution(facilities, get().getInventoryItem, get().updateInventory);

    // 更新设施状态
    facilities.forEach(facility => {
      if (facility.fuelBuffer) {
        get().updateFacility(facility.id, { fuelBuffer: facility.fuelBuffer });
      }
    });
  },

  updateFuelConsumption: (deltaTime: number) => {
    const fuelService = getService<FuelService>(SERVICE_TOKENS.FUEL_SERVICE);
    const facilities = get().facilities;

    // 小工具：为指定设施尝试补充 1 个燃料（按优先级选择兼容燃料）
    const tryRefuelOne = (facilityToRefuel: {
      id: string;
      facilityId: string;
      fuelBuffer?: Parameters<typeof fuelService.addFuel>[0];
    }): boolean => {
      if (!facilityToRefuel.fuelBuffer) return false;
      const priority = fuelService.getFuelPriority();
      const chosen = priority.find(
        fuelId =>
          fuelService.isFuelCompatible(facilityToRefuel.facilityId, fuelId) &&
          get().getInventoryItem(fuelId).currentAmount > 0
      );
      if (!chosen) return false;
      const addRes = fuelService.addFuel(
        facilityToRefuel.fuelBuffer,
        chosen,
        1,
        facilityToRefuel.facilityId
      );
      if (addRes.success && addRes.quantityAdded) {
        get().updateInventory(chosen, -addRes.quantityAdded);
        return true;
      }
      return false;
    };

    facilities.forEach(facility => {
      const buffer = facility.fuelBuffer;
      if (!buffer) return;

      const isProducing =
        facility.status === 'running' && facility.production?.progress !== undefined;
      const result = fuelService.updateFuelConsumption(
        facility,
        deltaTime,
        isProducing,
        get().getInventoryItem
      );

      if (!result.success && facility.status === 'running') {
        // 优先尝试最小补充（只补 1 个），成功则直接恢复运行；否则进入 no_fuel
        if (tryRefuelOne(facility)) {
          get().updateFacility(facility.id, { status: 'running', fuelBuffer: buffer });
        } else {
          get().updateFacility(facility.id, { status: 'no_fuel', fuelBuffer: buffer });
        }
        return;
      }

      if (result.success) {
        // 同步燃料缓存（例如 remainingEnergy 变化）
        get().updateFacility(facility.id, { fuelBuffer: buffer });
      }

      // 场景：设施处于 no_fuel，但玩家后来获得了燃料，周期性尝试最小补充
      if (facility.status === 'no_fuel' && tryRefuelOne(facility)) {
        get().updateFacility(facility.id, { status: 'running', fuelBuffer: buffer });
      }
    });
  },
});
