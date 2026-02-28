import type { GameCatalog } from '@/data/catalog/GameCatalog';
import type { GameState } from '@/engine/model/GameState';

const GENERATOR_POWER_KW: Record<string, number> = {
  'steam-engine': 900,
  'steam-turbine': 5800,
  'solar-panel': 42,
  accumulator: 300,
};

export interface RuntimePowerBalanceView {
  generationCapacity: number;
  actualGeneration: number;
  generationByType: Record<string, number>;
  consumptionDemand: number;
  actualConsumption: number;
  satisfactionRatio: number;
  status: 'surplus' | 'balanced' | 'deficit';
  consumptionByCategory: Record<string, number>;
}

export interface RuntimeGeneratorStat {
  count: number;
  power: number;
}

export const buildRuntimePowerBalanceView = (
  state: GameState,
  catalog: GameCatalog
): RuntimePowerBalanceView => {
  const consumptionByCategory: Record<string, number> = {};
  const generationByType: Record<string, number> = {};

  state.facilities.forEach(facility => {
    const generatorPower = (GENERATOR_POWER_KW[facility.facilityId] || 0) * facility.count;
    if (generatorPower > 0) {
      generationByType[facility.facilityId] =
        (generationByType[facility.facilityId] || 0) + generatorPower;
    }

    const item = catalog.itemsById.get(facility.facilityId);
    const machine = item?.machine;

    if (!machine || machine.type === 'burner' || GENERATOR_POWER_KW[facility.facilityId]) {
      return;
    }

    const category = item?.category || 'other';
    const demand = (machine.usage || 0) * facility.count;
    consumptionByCategory[category] = (consumptionByCategory[category] || 0) + demand;
  });

  const generationCapacity = state.power.generation;
  const consumptionDemand = state.power.consumption;
  const satisfactionRatio = state.power.satisfactionRatio;

  return {
    generationCapacity,
    actualGeneration: generationCapacity,
    generationByType,
    consumptionDemand,
    actualConsumption: Math.min(consumptionDemand, generationCapacity),
    satisfactionRatio,
    status: satisfactionRatio >= 1 ? 'surplus' : satisfactionRatio >= 0.95 ? 'balanced' : 'deficit',
    consumptionByCategory,
  };
};

export const buildRuntimeGeneratorStats = (state: GameState): Map<string, RuntimeGeneratorStat> => {
  const stats = new Map<string, RuntimeGeneratorStat>();

  state.facilities.forEach(facility => {
    const generatorPower = (GENERATOR_POWER_KW[facility.facilityId] || 0) * facility.count;
    if (generatorPower <= 0) {
      return;
    }

    const existing = stats.get(facility.facilityId) || { count: 0, power: 0 };
    stats.set(facility.facilityId, {
      count: existing.count + facility.count,
      power: existing.power + generatorPower,
    });
  });

  return stats;
};
