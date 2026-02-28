import { GameRuntime } from '@/app/runtime/GameRuntime';
import type { SnapshotRepository } from '@/app/persistence/SnapshotRepository';
import type { GameCatalog } from '@/data/catalog/GameCatalog';
import { createInitialGameState } from '@/engine/core/createInitialGameState';
import type { GameSnapshot } from '@/engine/model/GameSnapshot';
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

const createMemoryRepository = (): SnapshotRepository & {
  storedSnapshot: GameSnapshot | null;
} => {
  const repository = {
    storedSnapshot: null as GameSnapshot | null,
    async load() {
      return repository.storedSnapshot;
    },
    async save(snapshot: GameSnapshot) {
      repository.storedSnapshot = snapshot;
    },
    async clear() {
      repository.storedSnapshot = null;
    },
  };

  return repository;
};

describe('GameRuntime', () => {
  it('emits listener updates in command/tick order and saves the latest snapshot state', async () => {
    const repository = createMemoryRepository();
    const catalog = createCatalog({
      technologies: [
        createTechnology({
          id: 'automation',
          name: 'Automation',
          researchTime: 10,
          unlocks: {
            recipes: ['assembling-machine-1'],
          },
        }),
      ],
    });
    let nowMs = 1_000;
    const runtime = new GameRuntime({
      catalog,
      repository,
      initialState: createInitialGameState(),
      now: () => nowMs,
    });

    const notifications: Array<{
      queue: string[];
      currentTechId: string | null;
      progress: number;
      unlocks: string[];
      events: string[];
    }> = [];

    const unsubscribe = runtime.subscribe((state, events) => {
      notifications.push({
        queue: [...state.research.queue],
        currentTechId: state.research.currentTechId,
        progress: state.research.progress,
        unlocks: [...state.unlocks.techs],
        events: events.map(event => event.type),
      });
    });

    runtime.dispatch({ type: 'research/queue-add', techId: 'automation' });
    runtime.dispatch({ type: 'research/start', techId: 'automation' });

    nowMs = 6_000;
    runtime.tick(5_000);

    nowMs = 6_500;
    await runtime.save();

    nowMs = 11_000;
    runtime.tick(5_000);

    unsubscribe();
    runtime.dispatch({ type: 'research/queue-remove', techId: 'automation' });

    expect(notifications).toEqual([
      {
        queue: ['automation'],
        currentTechId: null,
        progress: 0,
        unlocks: [],
        events: [],
      },
      {
        queue: [],
        currentTechId: 'automation',
        progress: 0,
        unlocks: [],
        events: [],
      },
      {
        queue: [],
        currentTechId: 'automation',
        progress: 0.5,
        unlocks: [],
        events: [],
      },
      {
        queue: [],
        currentTechId: null,
        progress: 0,
        unlocks: ['automation'],
        events: ['research/completed', 'technology/unlocked'],
      },
    ]);

    expect(repository.storedSnapshot).toEqual({
      schemaVersion: 1,
      savedAtMs: 6_500,
      state: {
        ...createInitialGameState(),
        simulationTimeMs: 5_000,
        research: {
          currentTechId: 'automation',
          progress: 0.5,
          queue: [],
          autoResearch: true,
        },
      },
    });
    expect(runtime.getState().unlocks).toEqual({
      techs: ['automation'],
      recipes: ['assembling-machine-1'],
      items: [],
      buildings: [],
    });
  });

  it('does not fail when saving without a repository', async () => {
    const runtime = new GameRuntime({
      catalog: createCatalog(),
      initialState: createInitialGameState(),
      now: () => 123,
    });

    await expect(runtime.save()).resolves.toBeUndefined();
    expect(runtime.getState()).toEqual(createInitialGameState());
  });

  it('exposes the current state and catalog without mutating them during subscription setup', () => {
    const initialState: GameState = {
      ...createInitialGameState(),
      inventory: {
        items: { 'iron-plate': 10 },
      },
    };
    const catalog = createCatalog({
      technologies: [createTechnology({ id: 'automation', name: 'Automation' })],
    });
    const runtime = new GameRuntime({
      catalog,
      initialState,
      now: () => 0,
    });

    const listener = () => {};
    const unsubscribe = runtime.subscribe(listener);

    expect(runtime.getState()).toBe(initialState);
    expect(runtime.getCatalog()).toBe(catalog);

    unsubscribe();
  });
});
