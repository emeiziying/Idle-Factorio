import {
  buildTechnologyCardMetadataMap,
  buildTechnologyCardStateMap,
  buildTechnologyTriggerProgressMap,
  filterDisplayTechnologies,
  getQueuedTechnologyIds,
  getTechnologyCardState,
  getTechnologyDetailState,
  sortTechnologiesByStatus,
} from '@/engine/selectors/technologySelectors';
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

const createCatalog = (
  options: {
    technologies?: Technology[];
    items?: Item[];
    recipes?: Recipe[];
  } = {}
): GameCatalog => {
  const technologies = options.technologies || [];
  const items = options.items || [];
  const recipes = options.recipes || [];
  const categories: Category[] = [];
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
    itemsById: new Map(items.map(item => [item.id, item])),
    recipesById: new Map(recipes.map(recipe => [recipe.id, recipe])),
    recipesByOutput: new Map(),
    categoriesById: new Map(),
    technologiesById: new Map(technologies.map(technology => [technology.id, technology])),
    technologiesInOrder: technologies,
  };
};

describe('technologySelectors', () => {
  it('marks current research as researching with progress', () => {
    const technology = createTechnology({ id: 'logistics', name: 'Logistics' });
    const state = createState({
      research: {
        currentTechId: 'logistics',
        progress: 0.4,
        queue: [],
        autoResearch: true,
      },
    });

    expect(getTechnologyCardState(state, technology)).toEqual({
      status: 'researching',
      progress: 0.4,
    });
  });

  it('marks unlocked prerequisites as available', () => {
    const technology = createTechnology({
      id: 'automation-2',
      name: 'Automation 2',
      prerequisites: ['automation'],
    });
    const state = createState({
      unlocks: {
        techs: ['automation'],
        recipes: [],
        items: [],
        buildings: [],
      },
    });

    expect(getTechnologyCardState(state, technology)).toEqual({
      status: 'available',
    });
  });

  it('builds detail state with remaining time and queue ids', () => {
    const technology = createTechnology({
      id: 'steel-processing',
      name: 'Steel Processing',
      researchTime: 60,
    });
    const state = createState({
      research: {
        currentTechId: 'steel-processing',
        progress: 0.25,
        queue: ['logistics'],
        autoResearch: true,
      },
    });

    expect(getTechnologyDetailState(state, technology)).toEqual({
      status: 'researching',
      progress: 0.25,
      timeRemaining: 45,
    });
    expect(Array.from(getQueuedTechnologyIds(state))).toEqual(['logistics']);
  });

  it('sorts by status priority and filters locked cards', () => {
    const technologies = [
      createTechnology({ id: 'locked-tech', name: 'Locked Tech', prerequisites: ['automation'] }),
      createTechnology({ id: 'researching-tech', name: 'Researching Tech' }),
      createTechnology({ id: 'available-tech', name: 'Available Tech' }),
      createTechnology({ id: 'unlocked-tech', name: 'Unlocked Tech' }),
    ];
    const state = createState({
      research: {
        currentTechId: 'researching-tech',
        progress: 0.1,
        queue: [],
        autoResearch: true,
      },
      unlocks: {
        techs: ['unlocked-tech'],
        recipes: [],
        items: [],
        buildings: [],
      },
    });

    const techStates = buildTechnologyCardStateMap(technologies, state);
    const sorted = sortTechnologiesByStatus(technologies, techStates);
    const visible = filterDisplayTechnologies(sorted, techStates);

    expect(sorted.map(technology => technology.id)).toEqual([
      'available-tech',
      'researching-tech',
      'unlocked-tech',
      'locked-tech',
    ]);
    expect(visible.map(technology => technology.id)).toEqual([
      'available-tech',
      'researching-tech',
      'unlocked-tech',
    ]);
  });

  it('builds card metadata from catalog without service access', () => {
    const automation = createTechnology({ id: 'automation', name: 'Automation' });
    const logistics = createTechnology({
      id: 'logistics',
      name: 'Logistics',
      prerequisites: ['automation'],
      unlocks: {
        items: ['transport-belt'],
        recipes: ['underground-belt'],
        buildings: ['lab'],
      },
      researchTrigger: {
        type: 'craft-item',
        item: 'iron-plate',
        count: 10,
      },
      researchCost: { 'automation-science-pack': 10 },
      researchTime: 30,
      researchUnits: 5,
    });
    const catalog = createCatalog({
      technologies: [automation, logistics],
      items: [
        {
          id: 'transport-belt',
          name: 'Transport Belt',
          category: 'logistics',
          stack: 100,
          row: 0,
        },
        {
          id: 'lab',
          name: 'Lab',
          category: 'production',
          stack: 50,
          row: 0,
        },
      ],
      recipes: [
        {
          id: 'logistics',
          name: 'Logistics',
          category: 'technology',
          time: 15,
          count: 4,
          in: { 'automation-science-pack': 1 },
          out: {},
        },
        {
          id: 'underground-belt',
          name: 'Underground Belt',
          category: 'logistics',
          time: 1,
          in: {},
          out: {},
        },
      ],
    });

    const metadata = buildTechnologyCardMetadataMap([automation, logistics], catalog).get(
      'logistics'
    );

    expect(metadata).toBeDefined();
    expect(metadata?.prerequisiteNames).toEqual(['Automation']);
    expect(metadata?.unlockedContent.total).toBe(3);
    expect(metadata?.unlockedContent.items[0]).toEqual({
      id: 'transport-belt',
      name: '基础传送带',
    });
    expect(metadata?.researchTriggerInfo).toEqual({
      hasResearchTrigger: true,
      triggerType: 'craft-item',
      triggerItem: 'iron-plate',
      triggerCount: 10,
    });
    expect(metadata?.researchRecipe).toEqual({
      inputs: [{ itemId: 'automation-science-pack', amount: 1 }],
      time: 15,
      count: 4,
    });
  });

  it('builds trigger progress from runtime stats', () => {
    const technologies = [
      createTechnology({
        id: 'steam-power',
        name: 'Steam Power',
        researchTrigger: {
          type: 'build-entity',
          entity: 'boiler',
          count: 2,
        },
      }),
    ];
    const state = createState({
      stats: {
        totalItemsProduced: 0,
        craftedItemCounts: {},
        builtEntityCounts: { boiler: 1 },
        minedEntityCounts: {},
      },
    });

    const progress = buildTechnologyTriggerProgressMap(technologies, state).get('steam-power');

    expect(progress).toEqual({
      currentCount: 1,
      requiredCount: 2,
      completed: false,
    });
  });
});
