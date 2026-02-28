import { createGameRuntime } from '@/app/bootstrap/createGameRuntime';
import type { SnapshotRepository } from '@/app/persistence/SnapshotRepository';
import type { GameCatalog } from '@/data/catalog/GameCatalog';
import type { GameSnapshot } from '@/engine/model/GameSnapshot';
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

describe('createGameRuntime', () => {
  it('normalizes a legacy import by unlocking satisfied trigger technologies immediately', async () => {
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
      items: [
        {
          id: 'electronic-circuit',
          name: 'Electronic Circuit',
          category: 'intermediate-products',
          stack: 200,
          row: 0,
        },
      ],
    });
    const repository = createMemoryRepository();

    const runtime = await createGameRuntime({
      catalog,
      repository,
      legacyState: {
        unlockedTechs: new Set(),
        craftedItemCounts: new Map([['copper-cable', 12]]),
        builtEntityCounts: new Map(),
        minedEntityCounts: new Map(),
      },
      now: () => 1_000,
    });

    expect(repository.storedSnapshot).not.toBeNull();
    expect(repository.storedSnapshot?.state.unlocks.techs).toEqual([]);
    expect(runtime.getState().unlocks.techs).toEqual(['electronics']);
    expect(runtime.getState().unlocks.items).toEqual(['electronic-circuit']);
    expect(runtime.getState().stats.craftedItemCounts).toEqual({ 'copper-cable': 12 });
    expect(runtime.getState().simulationTimeMs).toBe(0);
  });
});
