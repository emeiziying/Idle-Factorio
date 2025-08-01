// 设施管理切片
import type { SliceCreator, FacilitySlice } from '@/store/types';
import type { FuelService } from '@/services/crafting/FuelService';
import type { DataService } from '@/services/core/DataService';
import { getService } from '@/services/core/DIServiceInitializer';
import { SERVICE_TOKENS } from '@/services/core/ServiceTokens';

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
    set(state => ({
      facilities: state.facilities.filter(facility => facility.id !== facilityId),
    }));
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

    facilities.forEach(facility => {
      if (facility.fuelBuffer) {
        const isProducing =
          facility.status === 'running' && facility.production?.progress !== undefined;
        const result = fuelService.updateFuelConsumption(
          facility,
          deltaTime,
          isProducing,
          get().getInventoryItem
        );

        if (!result.success && facility.status === 'running') {
          // 燃料耗尽，更新状态
          get().updateFacility(facility.id, {
            status: 'no_fuel',
            fuelBuffer: facility.fuelBuffer,
          });

          // 尝试自动补充
          const refuelResult = fuelService.autoRefuel(facility, get().getInventoryItem);
          if (refuelResult.success) {
            // 扣除库存
            Object.entries(refuelResult.itemsConsumed).forEach(([itemId, amount]) => {
              get().updateInventory(itemId, -amount);
            });

            // 恢复运行
            get().updateFacility(facility.id, {
              status: 'running',
              fuelBuffer: facility.fuelBuffer,
            });
          }
        } else if (result.success) {
          // 更新燃料缓存
          get().updateFacility(facility.id, { fuelBuffer: facility.fuelBuffer });
        }
      }
    });
  },
});
