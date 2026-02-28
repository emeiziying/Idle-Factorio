import { FUEL_PRIORITY, getFuelCategory } from '@/data/fuelConfigs';
import type { GameCatalog } from '@/data/catalog/GameCatalog';
import type { DomainEvent } from '@/engine/model/DomainEvent';
import type {
  FacilityFuelState,
  FacilityState,
  GameState,
  PowerState,
} from '@/engine/model/GameState';
import type { Item } from '@/types';

const GENERATOR_POWER_KW: Record<string, number> = {
  'steam-engine': 900,
  'steam-turbine': 5800,
  'solar-panel': 42,
  accumulator: 300,
};

export const updateFacilityPowerState = (
  state: GameState,
  catalog: GameCatalog
): {
  state: GameState;
  events: DomainEvent[];
} => {
  const power = calculatePowerState(state.facilities, catalog);
  const events: DomainEvent[] = [];

  const facilities = state.facilities.map<FacilityState>(facility => {
    const item = catalog.itemsById.get(facility.facilityId);
    const machine = item?.machine;
    if (!machine || machine.type === 'burner') {
      return facility;
    }

    const powerDemand = getFacilityPowerDemand(facility, item);
    if (powerDemand === 0) {
      return facility;
    }

    if (power.satisfactionRatio <= 0) {
      if (facility.status !== 'no_power') {
        events.push({
          type: 'facility/no-power',
          instanceId: facility.id,
        });
      }

      return {
        ...facility,
        status: 'no_power',
        efficiency: 0,
      };
    }

    const nextStatus: FacilityState['status'] =
      facility.status === 'no_power' ? 'running' : facility.status;

    return {
      ...facility,
      status: nextStatus,
      efficiency: power.satisfactionRatio >= 1 ? 1 : power.satisfactionRatio,
    };
  });

  return {
    state: {
      ...state,
      facilities,
      power,
    },
    events,
  };
};

export const tickFacilityFuelState = (
  state: GameState,
  catalog: GameCatalog,
  deltaMs: number
): {
  state: GameState;
  events: DomainEvent[];
} => {
  const nextInventory = { ...state.inventory.items };
  const events: DomainEvent[] = [];

  const facilities = state.facilities.map<FacilityState>(facility => {
    const item = catalog.itemsById.get(facility.facilityId);
    const machine = item?.machine;
    if (!machine || machine.type !== 'burner') {
      return facility;
    }

    if (facility.status === 'no_fuel') {
      return tryRefuelOne(facility, nextInventory, item, catalog) || facility;
    }

    if (facility.status !== 'running' || !facility.production) {
      return facility;
    }

    if (!hasFuelDemand(facility, state, catalog)) {
      return facility;
    }

    const energyNeeded = ((machine.usage || 0) * (deltaMs / 1000) * facility.efficiency) / 1000;
    const consumption = consumeFuel(facility.fuel, energyNeeded, catalog);

    if (consumption.success) {
      return {
        ...facility,
        fuel: consumption.fuel,
      };
    }

    const refueledFacility = tryRefuelOne(
      {
        ...facility,
        fuel: consumption.fuel,
      },
      nextInventory,
      item,
      catalog
    );

    if (refueledFacility) {
      return refueledFacility;
    }

    events.push({
      type: 'facility/no-fuel',
      instanceId: facility.id,
    });

    return {
      ...facility,
      status: 'no_fuel',
      fuel: consumption.fuel,
    };
  });

  return {
    state: {
      ...state,
      facilities,
      inventory: {
        items: nextInventory,
      },
    },
    events,
  };
};

const calculatePowerState = (
  facilities: readonly FacilityState[],
  catalog: GameCatalog
): PowerState => {
  const generation = facilities.reduce((total, facility) => {
    const item = catalog.itemsById.get(facility.facilityId);
    return total + getFacilityPowerGeneration(facility, item);
  }, 0);
  const consumption = facilities.reduce((total, facility) => {
    const item = catalog.itemsById.get(facility.facilityId);
    return total + getFacilityPowerDemand(facility, item);
  }, 0);

  return {
    generation,
    consumption,
    satisfactionRatio: consumption > 0 ? Math.min(1, generation / consumption) : 1,
  };
};

const getFacilityPowerGeneration = (facility: FacilityState, item?: Item): number => {
  if (facility.status !== 'running') {
    return 0;
  }

  const basePowerKw = GENERATOR_POWER_KW[facility.facilityId] ?? 0;
  if (basePowerKw > 0) {
    return basePowerKw * facility.count;
  }

  if (!item?.machine?.usage || !isPowerGenerator(facility.facilityId)) {
    return 0;
  }

  return item.machine.usage * facility.count;
};

const getFacilityPowerDemand = (facility: FacilityState, item?: Item): number => {
  if (
    facility.status === 'stopped' ||
    item?.machine?.type === 'burner' ||
    isPowerGenerator(facility.facilityId)
  ) {
    return 0;
  }

  return (item?.machine?.usage || 0) * facility.count;
};

const isPowerGenerator = (facilityId: string): boolean => {
  return (
    facilityId === 'steam-engine' ||
    facilityId === 'steam-turbine' ||
    facilityId === 'solar-panel' ||
    facilityId === 'accumulator'
  );
};

const hasFuelDemand = (
  facility: FacilityState,
  state: GameState,
  catalog: GameCatalog
): boolean => {
  const recipeId = facility.production?.recipeId;
  if (!recipeId) {
    return false;
  }

  const recipe = catalog.recipesById.get(recipeId);
  if (!recipe?.in) {
    return true;
  }

  return Object.entries(recipe.in).every(
    ([itemId, requiredAmount]) => (state.inventory.items[itemId] || 0) >= requiredAmount
  );
};

const consumeFuel = (
  fuel: FacilityFuelState | null,
  energyNeeded: number,
  catalog: GameCatalog
): {
  success: boolean;
  fuel: FacilityFuelState | null;
} => {
  if (energyNeeded <= 0) {
    return {
      success: true,
      fuel,
    };
  }

  if (!fuel?.itemId || fuel.quantity <= 0) {
    return {
      success: false,
      fuel: null,
    };
  }

  const fuelItem = catalog.itemsById.get(fuel.itemId);
  const fuelValue = fuelItem?.fuel?.value || 0;
  if (fuelValue <= 0) {
    return {
      success: false,
      fuel: null,
    };
  }

  let remainingNeed = energyNeeded;
  let energyConsumed = 0;
  let nextFuel: FacilityFuelState | null = { ...fuel };

  while (nextFuel && remainingNeed > 0 && nextFuel.quantity > 0) {
    const energyAvailable = Math.max(0, nextFuel.remainingEnergy);
    const energyToConsume = Math.min(remainingNeed, energyAvailable);

    nextFuel.remainingEnergy -= energyToConsume;
    remainingNeed -= energyToConsume;
    energyConsumed += energyToConsume;

    if (nextFuel.remainingEnergy <= 0) {
      nextFuel.quantity -= 1;
      if (nextFuel.quantity > 0) {
        nextFuel.remainingEnergy = fuelValue;
      } else {
        nextFuel = null;
      }
    }
  }

  return {
    success: energyConsumed > 0,
    fuel: nextFuel,
  };
};

const tryRefuelOne = (
  facility: FacilityState,
  inventory: Record<string, number>,
  facilityItem: Item,
  catalog: GameCatalog
): FacilityState | null => {
  const machine = facilityItem.machine;
  if (!machine) {
    return null;
  }

  const existingFuel = facility.fuel;
  const preferredFuelId = FUEL_PRIORITY.find(fuelId => {
    if (
      (inventory[fuelId] || 0) <= 0 ||
      !isFuelCompatible(machine.fuelCategories || [], fuelId, catalog)
    ) {
      return false;
    }

    if (!existingFuel?.itemId) {
      return true;
    }

    if (existingFuel.itemId !== fuelId) {
      return false;
    }

    const fuelItem = catalog.itemsById.get(fuelId);
    return existingFuel.quantity < (fuelItem?.stack || 50);
  });

  if (!preferredFuelId) {
    return null;
  }

  const fuelItem = catalog.itemsById.get(preferredFuelId);
  const fuelValue = fuelItem?.fuel?.value || 0;
  if (fuelValue <= 0) {
    return null;
  }

  inventory[preferredFuelId] = Math.max(0, (inventory[preferredFuelId] || 0) - 1);

  const runningStatus: FacilityState['status'] = 'running';

  return {
    ...facility,
    status: runningStatus,
    fuel:
      existingFuel?.itemId === preferredFuelId
        ? {
            ...existingFuel,
            quantity: existingFuel.quantity + 1,
          }
        : {
            itemId: preferredFuelId,
            quantity: 1,
            remainingEnergy: fuelValue,
          },
  };
};

const isFuelCompatible = (
  acceptedCategories: readonly string[],
  fuelItemId: string,
  catalog: GameCatalog
): boolean => {
  const fuelItem = catalog.itemsById.get(fuelItemId);
  const fuelCategory = fuelItem?.fuel?.category || getFuelCategory(fuelItemId);
  return !!fuelCategory && acceptedCategories.includes(fuelCategory);
};
