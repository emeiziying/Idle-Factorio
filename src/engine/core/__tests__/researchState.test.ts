import { createInitialGameState } from '@/engine/core/createInitialGameState';
import { applyGameCommand } from '@/engine/core/applyGameCommand';
import { tickGame } from '@/engine/core/tickGame';
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
    researchTime: 10,
    unlocks: {},
    position: { x: 0, y: 0 },
    ...rest,
  };
};

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

const createState = (overrides?: Partial<GameState>): GameState => ({
  ...createInitialGameState(),
  ...overrides,
  research: {
    ...createInitialGameState().research,
    ...(overrides?.research || {}),
  },
  unlocks: {
    ...createInitialGameState().unlocks,
    ...(overrides?.unlocks || {}),
  },
});

describe('researchState', () => {
  it('starts research and removes the technology from queue', () => {
    const catalog = createCatalog({
      technologies: [createTechnology({ id: 'automation', name: 'Automation' })],
    });
    const queuedState = createState({
      research: {
        currentTechId: null,
        progress: 0,
        queue: ['automation'],
        autoResearch: true,
      },
    });

    const result = applyGameCommand(
      queuedState,
      { type: 'research/start', techId: 'automation' },
      { catalog }
    );

    expect(result.state.research).toEqual({
      currentTechId: 'automation',
      progress: 0,
      queue: [],
      autoResearch: true,
    });
    expect(result.events).toEqual([]);
  });

  it('queues, removes and toggles auto research via commands', () => {
    const catalog = createCatalog({
      technologies: [createTechnology({ id: 'automation', name: 'Automation' })],
    });

    const queued = applyGameCommand(
      createState(),
      { type: 'research/queue-add', techId: 'automation' },
      { catalog }
    );
    const removed = applyGameCommand(
      queued.state,
      { type: 'research/queue-remove', techId: 'automation' },
      { catalog }
    );
    const autoDisabled = applyGameCommand(
      removed.state,
      { type: 'research/auto-set', enabled: false },
      { catalog }
    );

    expect(queued.state.research.queue).toEqual(['automation']);
    expect(removed.state.research.queue).toEqual([]);
    expect(autoDisabled.state.research.autoResearch).toBe(false);
  });

  it('does not allow trigger research technologies to be started or queued manually', () => {
    const catalog = createCatalog({
      technologies: [
        createTechnology({
          id: 'circuit-network',
          name: 'Circuit Network',
          researchTrigger: {
            type: 'craft-item',
            item: 'electronic-circuit',
            count: 5,
          },
        }),
      ],
    });
    const initialState = createState();

    const queued = applyGameCommand(
      initialState,
      { type: 'research/queue-add', techId: 'circuit-network' },
      { catalog }
    );
    const started = applyGameCommand(
      queued.state,
      { type: 'research/start', techId: 'circuit-network' },
      { catalog }
    );

    expect(queued.state).toEqual(initialState);
    expect(started.state).toEqual(initialState);
  });

  it('auto starts the first available queued research and advances progress', () => {
    const automation = createTechnology({ id: 'automation', name: 'Automation', researchTime: 10 });
    const automation2 = createTechnology({
      id: 'automation-2',
      name: 'Automation 2',
      researchTime: 10,
      prerequisites: ['automation'],
    });
    const catalog = createCatalog({
      technologies: [automation, automation2],
    });
    const state = createState({
      research: {
        currentTechId: null,
        progress: 0,
        queue: ['automation-2', 'automation'],
        autoResearch: true,
      },
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 5_000,
      deltaMs: 5_000,
    });

    expect(result.state.research.currentTechId).toBe('automation');
    expect(result.state.research.progress).toBe(0.5);
    expect(result.state.research.queue).toEqual(['automation-2']);
    expect(result.state.simulationTimeMs).toBe(5_000);
  });

  it('does not auto start queued research when auto research is disabled', () => {
    const catalog = createCatalog({
      technologies: [createTechnology({ id: 'automation', name: 'Automation', researchTime: 10 })],
    });
    const state = createState({
      research: {
        currentTechId: null,
        progress: 0,
        queue: ['automation'],
        autoResearch: false,
      },
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 1_000,
      deltaMs: 1_000,
    });

    expect(result.state.research.currentTechId).toBeNull();
    expect(result.state.research.progress).toBe(0);
    expect(result.state.research.queue).toEqual(['automation']);
    expect(result.state.simulationTimeMs).toBe(1_000);
  });

  it('completes research, unlocks rewards and emits completion events', () => {
    const catalog = createCatalog({
      technologies: [
        createTechnology({
          id: 'logistics',
          name: 'Logistics',
          researchTime: 10,
          unlocks: {
            items: ['transport-belt'],
            recipes: ['underground-belt'],
            buildings: ['lab'],
          },
        }),
      ],
    });
    const state = createState({
      research: {
        currentTechId: 'logistics',
        progress: 0.8,
        queue: [],
        autoResearch: true,
      },
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 10_000,
      deltaMs: 2_500,
    });

    expect(result.state.research).toEqual({
      currentTechId: null,
      progress: 0,
      queue: [],
      autoResearch: true,
    });
    expect(result.state.unlocks).toEqual({
      techs: ['logistics'],
      recipes: ['underground-belt'],
      items: ['transport-belt'],
      buildings: ['lab'],
    });
    expect(result.state.simulationTimeMs).toBe(2_500);
    expect(result.events).toEqual([
      { type: 'research/completed', techId: 'logistics' },
      { type: 'technology/unlocked', techId: 'logistics' },
    ]);
  });

  it('auto unlocks trigger technologies when crafted counts meet the requirement', () => {
    const catalog = createCatalog({
      technologies: [
        createTechnology({
          id: 'electronics',
          name: 'Electronics',
          researchTrigger: {
            type: 'craft-item',
            item: 'copper-cable',
            count: 10,
          },
          unlocks: {
            items: ['electronic-circuit'],
          },
        }),
      ],
    });
    const state = createState({
      stats: {
        totalItemsProduced: 0,
        craftedItemCounts: { 'copper-cable': 12 },
        builtEntityCounts: {},
        minedEntityCounts: {},
      },
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 0,
      deltaMs: 0,
    });

    expect(result.state.unlocks.techs).toEqual(['electronics']);
    expect(result.state.unlocks.items).toEqual(['electronic-circuit']);
    expect(result.events).toEqual([{ type: 'technology/unlocked', techId: 'electronics' }]);
  });

  it('does not auto unlock trigger technologies before prerequisites are unlocked', () => {
    const catalog = createCatalog({
      technologies: [
        createTechnology({ id: 'automation', name: 'Automation' }),
        createTechnology({
          id: 'steam-power',
          name: 'Steam Power',
          prerequisites: ['automation'],
          researchTrigger: {
            type: 'build-entity',
            entity: 'boiler',
            count: 1,
          },
        }),
      ],
    });
    const state = createState({
      stats: {
        totalItemsProduced: 0,
        craftedItemCounts: {},
        builtEntityCounts: { boiler: 1 },
        minedEntityCounts: {},
      },
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 0,
      deltaMs: 0,
    });

    expect(result.state.unlocks.techs).toEqual([]);
    expect(result.events).toEqual([]);
  });

  it('unlocks multi-level trigger technologies in dependency order within one tick', () => {
    const catalog = createCatalog({
      technologies: [
        createTechnology({
          id: 'electronics',
          name: 'Electronics',
          researchTrigger: {
            type: 'craft-item',
            item: 'copper-cable',
            count: 10,
          },
        }),
        createTechnology({
          id: 'steam-power',
          name: 'Steam Power',
          prerequisites: ['electronics'],
          researchTrigger: {
            type: 'build-entity',
            entity: 'boiler',
            count: 1,
          },
          unlocks: {
            buildings: ['steam-engine'],
          },
        }),
      ],
      items: [
        {
          id: 'steam-engine',
          name: 'Steam Engine',
          category: 'production',
          stack: 50,
          row: 0,
        },
      ],
    });
    const state = createState({
      stats: {
        totalItemsProduced: 0,
        craftedItemCounts: { 'copper-cable': 10 },
        builtEntityCounts: { boiler: 1 },
        minedEntityCounts: {},
      },
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 0,
      deltaMs: 0,
    });

    expect(result.state.unlocks.techs).toEqual(['electronics', 'steam-power']);
    expect(result.state.unlocks.buildings).toEqual(['steam-engine']);
    expect(result.events).toEqual([
      { type: 'technology/unlocked', techId: 'electronics' },
      { type: 'technology/unlocked', techId: 'steam-power' },
    ]);
  });
});
