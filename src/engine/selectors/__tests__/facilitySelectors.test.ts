import {
  buildRuntimeGeneratorStats,
  buildRuntimePowerBalanceView,
} from '@/engine/selectors/facilitySelectors';
import type { GameCatalog } from '@/data/catalog/GameCatalog';
import { createInitialGameState } from '@/engine/core/createInitialGameState';
import type { Category, GameData, Item, Recipe } from '@/types';
import type { Technology } from '@/types/technology';
import { describe, expect, it } from 'vitest';

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

describe('facilitySelectors', () => {
  it('builds runtime power balance with generation/consumption breakdowns', () => {
    const catalog = createCatalog({
      items: [
        {
          id: 'steam-engine',
          name: 'Steam Engine',
          category: 'power',
          stack: 50,
          row: 0,
          machine: {
            speed: 1,
            type: 'electric',
            usage: 0,
            size: [3, 3],
            entityType: 'generator',
          },
        },
        {
          id: 'assembling-machine-1',
          name: 'Assembler',
          category: 'crafting',
          stack: 50,
          row: 0,
          machine: {
            speed: 0.5,
            type: 'electric',
            usage: 150,
            size: [3, 3],
            entityType: 'assembler',
          },
        },
      ],
    });

    const state = {
      ...createInitialGameState(),
      facilities: [
        {
          id: 'steam-1',
          facilityId: 'steam-engine',
          count: 2,
          targetItemId: null,
          status: 'running' as const,
          efficiency: 1,
          production: null,
          fuel: null,
        },
        {
          id: 'assembler-1',
          facilityId: 'assembling-machine-1',
          count: 1,
          targetItemId: null,
          status: 'running' as const,
          efficiency: 1,
          production: null,
          fuel: null,
        },
      ],
      power: {
        generation: 1800,
        consumption: 150,
        satisfactionRatio: 1,
      },
    };

    const view = buildRuntimePowerBalanceView(state, catalog);

    expect(view.generationCapacity).toBe(1800);
    expect(view.consumptionDemand).toBe(150);
    expect(view.generationByType['steam-engine']).toBe(1800);
    expect(view.consumptionByCategory.crafting).toBe(150);
    expect(view.status).toBe('surplus');
  });

  it('builds runtime generator stats from facilities', () => {
    const state = {
      ...createInitialGameState(),
      facilities: [
        {
          id: 'solar-1',
          facilityId: 'solar-panel',
          count: 3,
          targetItemId: null,
          status: 'running' as const,
          efficiency: 1,
          production: null,
          fuel: null,
        },
        {
          id: 'solar-2',
          facilityId: 'solar-panel',
          count: 2,
          targetItemId: null,
          status: 'running' as const,
          efficiency: 1,
          production: null,
          fuel: null,
        },
      ],
    };

    const stats = buildRuntimeGeneratorStats(state);

    expect(stats.get('solar-panel')).toEqual({
      count: 5,
      power: 5 * 42,
    });
  });
});
