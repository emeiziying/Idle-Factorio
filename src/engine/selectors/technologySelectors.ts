import type { GameCatalog } from '@/data/catalog/GameCatalog';
import {
  getLocalizedCatalogItemName,
  getLocalizedCatalogRecipeName,
  getLocalizedCatalogTechnologyName,
} from '@/data/catalog/catalogLocalization';
import { getResearchTriggerProgress } from '@/engine/core/researchTriggers';
import type { GameState } from '@/engine/model/GameState';
import type { TechStatus, Technology } from '@/types/technology';

export interface TechnologyCardState {
  status: TechStatus;
  progress?: number;
}

export interface TechnologyDetailState extends TechnologyCardState {
  timeRemaining?: number;
}

export interface TechnologyUnlockedContentInfo {
  items: Array<{ id: string; name: string }>;
  recipes: Array<{ id: string; name: string }>;
  buildings: Array<{ id: string; name: string }>;
  total: number;
}

export interface TechnologyResearchTriggerInfo {
  hasResearchTrigger: boolean;
  triggerType?: string;
  triggerItem?: string;
  triggerCount?: number;
}

export interface TechnologyResearchTriggerProgress {
  currentCount: number;
  requiredCount: number;
  completed: boolean;
}

export interface TechnologyResearchRecipeInfo {
  inputs: Array<{ itemId: string; amount: number }>;
  time: number;
  count: number;
}

export interface TechnologyCardMetadata {
  unlockedContent: TechnologyUnlockedContentInfo;
  prerequisiteNames: string[];
  researchTriggerInfo: TechnologyResearchTriggerInfo;
  researchRecipe: TechnologyResearchRecipeInfo;
}

export interface TechnologyPrerequisiteInfo {
  id: string;
  name: string;
  unlocked: boolean;
}

export interface TechnologyResearchTriggerDisplay {
  description: string;
  itemName: string;
  itemId: string;
  count: number;
}

export interface TechnologyDetailMetadata {
  prerequisites: TechnologyPrerequisiteInfo[];
  unlockInfo: TechnologyUnlockedContentInfo;
  researchTrigger?: TechnologyResearchTriggerDisplay;
}

const STATUS_PRIORITY: Record<TechStatus, number> = {
  available: 3,
  researching: 2,
  unlocked: 1,
  locked: 0,
};

export const getTechnologyCardState = (
  state: GameState,
  technology: Technology
): TechnologyCardState => {
  if (state.unlocks.techs.includes(technology.id)) {
    return { status: 'unlocked' };
  }

  if (state.research.currentTechId === technology.id) {
    return {
      status: 'researching',
      progress: state.research.progress,
    };
  }

  if (technology.prerequisites.every(prerequisite => state.unlocks.techs.includes(prerequisite))) {
    return { status: 'available' };
  }

  return { status: 'locked' };
};

export const getTechnologyDetailState = (
  state: GameState,
  technology: Technology
): TechnologyDetailState => {
  const cardState = getTechnologyCardState(state, technology);

  if (cardState.status !== 'researching') {
    return cardState;
  }

  return {
    ...cardState,
    timeRemaining: Math.max(0, Math.ceil(technology.researchTime * (1 - state.research.progress))),
  };
};

export const buildTechnologyCardStateMap = (
  technologies: Iterable<Technology>,
  state: GameState
): Map<string, TechnologyCardState> => {
  const techStates = new Map<string, TechnologyCardState>();

  for (const technology of technologies) {
    techStates.set(technology.id, getTechnologyCardState(state, technology));
  }

  return techStates;
};

export const getQueuedTechnologyIds = (state: GameState): Set<string> => {
  return new Set(state.research.queue);
};

export const sortTechnologiesByStatus = (
  technologies: Technology[],
  techStates: Map<string, TechnologyCardState>
): Technology[] => {
  return [...technologies].sort((a, b) => {
    const stateA = techStates.get(a.id)?.status ?? 'locked';
    const stateB = techStates.get(b.id)?.status ?? 'locked';
    const priorityDiff = STATUS_PRIORITY[stateB] - STATUS_PRIORITY[stateA];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return a.name.localeCompare(b.name);
  });
};

export const filterDisplayTechnologies = (
  technologies: Technology[],
  techStates: Map<string, TechnologyCardState>
): Technology[] => {
  return technologies.filter(technology => {
    const status = techStates.get(technology.id)?.status ?? 'locked';
    return status === 'available' || status === 'researching' || status === 'unlocked';
  });
};

export const buildTechnologyCardMetadataMap = (
  technologies: Iterable<Technology>,
  catalog: GameCatalog
): Map<string, TechnologyCardMetadata> => {
  const metadataById = new Map<string, TechnologyCardMetadata>();
  const technologiesById = new Map<string, Technology>();

  for (const technology of technologies) {
    technologiesById.set(technology.id, technology);
  }

  for (const technology of technologiesById.values()) {
    metadataById.set(technology.id, {
      unlockedContent: getUnlockedContentInfo(technology, catalog),
      prerequisiteNames: technology.prerequisites.map(
        prerequisiteId =>
          technologiesById.get(prerequisiteId)?.name ||
          catalog.technologiesById.get(prerequisiteId)?.name ||
          prerequisiteId
      ),
      researchTriggerInfo: getResearchTriggerInfo(technology),
      researchRecipe: getResearchRecipeInfo(technology, catalog),
    });
  }

  return metadataById;
};

export const buildTechnologyTriggerProgressMap = (
  technologies: Iterable<Technology>,
  state: GameState
): Map<string, TechnologyResearchTriggerProgress> => {
  const progressById = new Map<string, TechnologyResearchTriggerProgress>();

  for (const technology of technologies) {
    const progress = getResearchTriggerProgress(state, technology);
    if (progress) {
      progressById.set(technology.id, progress);
    }
  }

  return progressById;
};

export const buildTechnologyDetailMetadata = (
  technology: Technology,
  catalog: GameCatalog,
  unlockedTechIds: Iterable<string>
): TechnologyDetailMetadata => {
  const unlockedTechSet = new Set(unlockedTechIds);

  return {
    prerequisites: technology.prerequisites.map(prerequisiteId => ({
      id: prerequisiteId,
      name:
        getLocalizedCatalogTechnologyName(prerequisiteId) ||
        catalog.technologiesById.get(prerequisiteId)?.name ||
        prerequisiteId,
      unlocked: unlockedTechSet.has(prerequisiteId),
    })),
    unlockInfo: getUnlockedContentInfo(technology, catalog),
    researchTrigger: technology.researchTrigger
      ? formatResearchTriggerDisplay(technology.researchTrigger, catalog)
      : undefined,
  };
};

const getUnlockedContentInfo = (
  technology: Technology,
  catalog: GameCatalog
): TechnologyUnlockedContentInfo => {
  const items = (technology.unlocks.items || []).map(id => ({
    id,
    name:
      getLocalizedCatalogItemName(id) || catalog.itemsById.get(id)?.name || humanizeIdentifier(id),
  }));

  const recipes = (technology.unlocks.recipes || []).map(id => ({
    id,
    name:
      getLocalizedCatalogRecipeName(id) ||
      catalog.recipesById.get(id)?.name ||
      humanizeIdentifier(id),
  }));

  const buildings = (technology.unlocks.buildings || []).map(id => ({
    id,
    name:
      getLocalizedCatalogItemName(id) || catalog.itemsById.get(id)?.name || humanizeIdentifier(id),
  }));

  return {
    items,
    recipes,
    buildings,
    total: items.length + recipes.length + buildings.length,
  };
};

const getResearchTriggerInfo = (technology: Technology): TechnologyResearchTriggerInfo => {
  if (!technology.researchTrigger) {
    return { hasResearchTrigger: false };
  }

  return {
    hasResearchTrigger: true,
    triggerType: technology.researchTrigger.type,
    triggerItem: technology.researchTrigger.item,
    triggerCount: technology.researchTrigger.count || 1,
  };
};

const formatResearchTriggerDisplay = (
  trigger: NonNullable<Technology['researchTrigger']>,
  catalog: GameCatalog
): TechnologyResearchTriggerDisplay | undefined => {
  switch (trigger.type) {
    case 'craft-item': {
      const itemId = trigger.item;
      if (!itemId) {
        return undefined;
      }

      return {
        description: `制造 ${trigger.count || 1} 件物品`,
        itemName:
          getLocalizedCatalogItemName(itemId) || catalog.itemsById.get(itemId)?.name || itemId,
        itemId,
        count: trigger.count || 1,
      };
    }

    case 'build-entity': {
      const itemId = trigger.entity;
      if (!itemId) {
        return undefined;
      }

      return {
        description: `建造 ${trigger.count || 1} 个建筑`,
        itemName:
          getLocalizedCatalogItemName(itemId) || catalog.itemsById.get(itemId)?.name || itemId,
        itemId,
        count: trigger.count || 1,
      };
    }

    case 'mine-entity': {
      const itemId = trigger.entity;
      if (!itemId) {
        return undefined;
      }

      return {
        description: `挖掘 ${trigger.count || 1} 个资源`,
        itemName:
          getLocalizedCatalogItemName(itemId) || catalog.itemsById.get(itemId)?.name || itemId,
        itemId,
        count: trigger.count || 1,
      };
    }

    case 'create-space-platform':
      return {
        description: '创建太空平台',
        itemName: getLocalizedCatalogItemName('space-platform') || '太空平台',
        itemId: 'space-platform',
        count: 1,
      };

    case 'capture-spawner':
      return {
        description: '捕获虫巢',
        itemName: getLocalizedCatalogItemName('spawner') || '虫巢',
        itemId: 'spawner',
        count: 1,
      };

    default:
      return undefined;
  }
};

const getResearchRecipeInfo = (
  technology: Technology,
  catalog: GameCatalog
): TechnologyResearchRecipeInfo => {
  const recipe = catalog.recipesById.get(technology.id);

  return {
    inputs: Object.entries(recipe?.in || technology.researchCost).map(([itemId, amount]) => ({
      itemId,
      amount,
    })),
    time: recipe?.time || technology.researchTime,
    count: recipe?.count || technology.researchUnits || 1,
  };
};

const humanizeIdentifier = (value: string): string => {
  return value.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
};
