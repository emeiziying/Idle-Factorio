import {
  adaptGameStateResearchToLegacyView,
  adaptRuntimeResearchToLegacyView,
} from '@/app/runtime/adapters/adaptRuntimeResearchToLegacyView';
import type { GameCatalog } from '@/data/catalog/GameCatalog';
import type { GameState } from '@/engine/model/GameState';
import type { Category, GameData, Item, Recipe } from '@/types';
import type { Technology } from '@/types/technology';
import { describe, expect, it } from 'vitest';

const createTechnology = (
  overrides: Partial<Technology> & Pick<Technology, 'id' | 'name'>
): Technology => {
  const { id, name, ...rest } = overrides;

  return {
    id,
    name,
    category: 'technology',
    prerequisites: [],
    researchCost: {},
    researchTime: 30,
    unlocks: {},
    position: { x: 0, y: 0 },
    ...rest,
  };
};

const createCatalog = (technologies: Technology[]): GameCatalog => {
  const categories: Category[] = [];
  const items: Item[] = [];
  const recipes: Recipe[] = [];
  const data: GameData = {
    version: {
      base: 'test',
      'elevated-rails': 'test',
      quality: 'test',
      'space-age': 'test',
    },
    categories,
    items,
    recipes,
    icons: [],
  };

  return {
    data,
    itemsById: new Map(),
    recipesById: new Map(),
    recipesByOutput: new Map(),
    categoriesById: new Map(),
    technologiesById: new Map(technologies.map(technology => [technology.id, technology])),
    technologiesInOrder: technologies,
  };
};

const createState = (overrides?: Partial<GameState>): GameState => ({
  simulationTimeMs: 0,
  inventory: { items: {} },
  facilities: [],
  research: {
    currentTechId: null,
    progress: 0,
    queue: [],
    autoResearch: true,
  },
  unlocks: {
    techs: [],
    recipes: [],
    items: [],
    buildings: [],
  },
  power: {
    generation: 0,
    consumption: 0,
    satisfactionRatio: 1,
  },
  stats: {
    totalItemsProduced: 0,
    craftedItemCounts: {},
    builtEntityCounts: {},
    minedEntityCounts: {},
  },
  ...overrides,
});

describe('adaptRuntimeResearchToLegacyView', () => {
  it('maps current research and queue metadata from game state', () => {
    const technologies = [
      createTechnology({ id: 'automation', name: 'Automation', researchTime: 60 }),
      createTechnology({
        id: 'steam-power',
        name: 'Steam Power',
        researchTime: 45,
        prerequisites: ['automation'],
      }),
    ];
    const catalog = createCatalog(technologies);
    const state = createState({
      research: {
        currentTechId: 'automation',
        progress: 0.25,
        queue: ['steam-power'],
        autoResearch: true,
      },
      unlocks: {
        techs: [],
        recipes: [],
        items: [],
        buildings: [],
      },
    });

    const view = adaptGameStateResearchToLegacyView(state, catalog);

    expect(view.currentResearch).toEqual({
      techId: 'automation',
      status: 'researching',
      progress: 0.25,
      timeRemaining: 45,
      currentCost: {},
    });
    expect(view.queue).toEqual([
      expect.objectContaining({
        techId: 'steam-power',
        canStart: false,
        blockedBy: ['automation'],
        queuePosition: 1,
      }),
    ]);
  });

  it('keeps the legacy runtime export as an alias', () => {
    const technology = createTechnology({ id: 'automation', name: 'Automation' });
    const catalog = createCatalog([technology]);
    const state = createState();

    expect(adaptRuntimeResearchToLegacyView(state, catalog)).toEqual(
      adaptGameStateResearchToLegacyView(state, catalog)
    );
  });
});
