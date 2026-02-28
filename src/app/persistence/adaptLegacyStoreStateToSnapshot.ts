import { CURRENT_GAME_SNAPSHOT_VERSION, type GameSnapshot } from '@/engine/model/GameSnapshot';
import { buildGameCatalog } from '@/data/catalog/buildGameCatalog';
import gameData from '@/data/spa/data.json';
import type { FacilityState, GameState, UnlockState } from '@/engine/model/GameState';
import type { FacilityInstance } from '@/types/facilities';
import type { GameData, InventoryItem, Technology } from '@/types/index';
import type { ResearchQueueItem, TechResearchState } from '@/types/technology';

let cachedTechnologies: Technology[] | null = null;

export interface LegacyStoreStateSnapshotInput {
  inventory?: Map<string, InventoryItem> | null;
  facilities?: FacilityInstance[];
  researchState?: TechResearchState | null;
  researchQueue?: ResearchQueueItem[];
  unlockedTechs?: Set<string>;
  autoResearch?: boolean;
  totalItemsProduced?: number;
  craftedItemCounts?: Map<string, number>;
  builtEntityCounts?: Map<string, number>;
  minedEntityCounts?: Map<string, number>;
  lastSaveTime?: number;
}

export interface AdaptLegacyStoreStateOptions {
  technologies?: Iterable<Technology>;
  savedAtMs?: number;
}

export const adaptLegacyStoreStateToSnapshot = (
  legacyState: LegacyStoreStateSnapshotInput,
  options: AdaptLegacyStoreStateOptions = {}
): GameSnapshot => {
  const savedAtMs = options.savedAtMs ?? legacyState.lastSaveTime ?? Date.now();

  return {
    schemaVersion: CURRENT_GAME_SNAPSHOT_VERSION,
    savedAtMs,
    state: adaptLegacyStoreStateToGameState(legacyState, options),
  };
};

export const adaptLegacyStoreStateToGameState = (
  legacyState: LegacyStoreStateSnapshotInput,
  options: AdaptLegacyStoreStateOptions = {}
): GameState => {
  const unlockedTechIds = Array.from(legacyState.unlockedTechs || []);
  const technologies = resolveTechnologies(options.technologies);

  return {
    simulationTimeMs: 0,
    inventory: {
      items: Object.fromEntries(
        Array.from(legacyState.inventory?.entries() || []).map(([itemId, item]) => [
          itemId,
          item.currentAmount,
        ])
      ),
    },
    facilities: (legacyState.facilities || []).map(adaptLegacyFacilityState),
    research: {
      currentTechId: legacyState.researchState?.techId || null,
      progress: legacyState.researchState?.progress || 0,
      queue: (legacyState.researchQueue || []).map(item => item.techId),
      autoResearch: legacyState.autoResearch ?? true,
    },
    unlocks: buildUnlockState(unlockedTechIds, technologies),
    power: {
      generation: 0,
      consumption: 0,
      satisfactionRatio: 1,
    },
    stats: {
      totalItemsProduced: legacyState.totalItemsProduced || 0,
      craftedItemCounts: Object.fromEntries(legacyState.craftedItemCounts?.entries() || []),
      builtEntityCounts: Object.fromEntries(legacyState.builtEntityCounts?.entries() || []),
      minedEntityCounts: Object.fromEntries(legacyState.minedEntityCounts?.entries() || []),
    },
  };
};

const adaptLegacyFacilityState = (facility: FacilityInstance): FacilityState => {
  const activeFuelSlot = facility.fuelBuffer?.slots?.[0];

  return {
    id: facility.id,
    facilityId: facility.facilityId,
    targetItemId: facility.targetItemId || null,
    status: facility.status,
    efficiency: facility.efficiency,
    production: facility.production?.currentRecipeId
      ? {
          recipeId: facility.production.currentRecipeId,
          progress: facility.production.progress,
        }
      : null,
    fuel:
      activeFuelSlot && activeFuelSlot.itemId
        ? {
            itemId: activeFuelSlot.itemId,
            quantity: activeFuelSlot.quantity,
            remainingEnergy: activeFuelSlot.remainingEnergy,
          }
        : null,
  };
};

const buildUnlockState = (
  unlockedTechIds: string[],
  technologies?: Iterable<Technology>
): UnlockState => {
  const technologyIndex = new Map<string, Technology>();

  for (const technology of technologies || []) {
    technologyIndex.set(technology.id, technology);
  }

  const recipes = new Set<string>();
  const items = new Set<string>();
  const buildings = new Set<string>();

  unlockedTechIds.forEach(techId => {
    const technology = technologyIndex.get(techId);
    technology?.unlocks.recipes?.forEach(recipeId => recipes.add(recipeId));
    technology?.unlocks.items?.forEach(itemId => items.add(itemId));
    technology?.unlocks.buildings?.forEach(buildingId => buildings.add(buildingId));
  });

  return {
    techs: unlockedTechIds,
    recipes: Array.from(recipes),
    items: Array.from(items),
    buildings: Array.from(buildings),
  };
};

const resolveTechnologies = (technologies?: Iterable<Technology>): Iterable<Technology> => {
  if (technologies) {
    return technologies;
  }

  if (!cachedTechnologies) {
    const catalog = buildGameCatalog(gameData as unknown as GameData);
    cachedTechnologies = [...catalog.technologiesInOrder];
  }

  return cachedTechnologies;
};
