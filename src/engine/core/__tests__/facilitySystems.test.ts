import { createInitialGameState } from '@/engine/core/createInitialGameState';
import { tickGame } from '@/engine/core/tickGame';
import type { GameCatalog } from '@/data/catalog/GameCatalog';
import type { GameState } from '@/engine/model/GameState';
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

const createState = (overrides?: Partial<GameState>): GameState => ({
  ...createInitialGameState(),
  ...overrides,
  inventory: {
    ...createInitialGameState().inventory,
    ...(overrides?.inventory || {}),
  },
  research: {
    ...createInitialGameState().research,
    ...(overrides?.research || {}),
  },
  unlocks: {
    ...createInitialGameState().unlocks,
    ...(overrides?.unlocks || {}),
  },
  power: {
    ...createInitialGameState().power,
    ...(overrides?.power || {}),
  },
  stats: {
    ...createInitialGameState().stats,
    ...(overrides?.stats || {}),
  },
});

describe('facilitySystems', () => {
  it('marks electric facilities as no_power and emits an event when generation is unavailable', () => {
    const catalog = createCatalog({
      items: [
        {
          id: 'assembling-machine-1',
          name: 'Assembling Machine 1',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 0.5,
            type: 'electric',
            usage: 150,
            size: [3, 3],
            entityType: 'assembling-machine',
          },
        },
      ],
    });
    const state = createState({
      facilities: [
        {
          id: 'assembler-1',
          facilityId: 'assembling-machine-1',
          count: 2,
          targetItemId: null,
          status: 'running',
          efficiency: 1,
          production: null,
          fuel: null,
        },
      ],
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 2_000,
      deltaMs: 2_000,
    });

    expect(result.state.power).toEqual({
      generation: 0,
      consumption: 300,
      satisfactionRatio: 0,
    });
    expect(result.state.facilities[0]).toMatchObject({
      status: 'no_power',
      efficiency: 0,
      count: 2,
    });
    expect(result.events).toEqual([{ type: 'facility/no-power', instanceId: 'assembler-1' }]);
  });

  it('calculates power deficit ratio from generator output and applies it to electric facilities', () => {
    const catalog = createCatalog({
      items: [
        {
          id: 'assembling-machine-1',
          name: 'Assembling Machine 1',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 0.5,
            type: 'electric',
            usage: 150,
            size: [3, 3],
            entityType: 'assembling-machine',
          },
        },
        {
          id: 'solar-panel',
          name: 'Solar Panel',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 0,
            type: 'electric',
            usage: 60,
            size: [3, 3],
            entityType: 'solar-panel',
          },
        },
      ],
    });
    const state = createState({
      facilities: [
        {
          id: 'assembler-1',
          facilityId: 'assembling-machine-1',
          count: 1,
          targetItemId: null,
          status: 'running',
          efficiency: 1,
          production: null,
          fuel: null,
        },
        {
          id: 'solar-1',
          facilityId: 'solar-panel',
          count: 1,
          targetItemId: null,
          status: 'running',
          efficiency: 1,
          production: null,
          fuel: null,
        },
      ],
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 1_000,
      deltaMs: 1_000,
    });

    expect(result.state.power.generation).toBe(42);
    expect(result.state.power.consumption).toBe(150);
    expect(result.state.power.satisfactionRatio).toBeCloseTo(0.28, 2);
    expect(result.state.facilities[0]).toMatchObject({
      status: 'running',
      efficiency: 42 / 150,
    });
    expect(result.events).toEqual([]);
  });

  it('consumes burner fuel while producing and leaves the remaining energy in state', () => {
    const catalog = createCatalog({
      items: [
        {
          id: 'stone-furnace',
          name: 'Stone Furnace',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 1,
            type: 'burner',
            fuelCategories: ['chemical'],
            usage: 100,
            size: [2, 2],
            entityType: 'furnace',
          },
        },
        {
          id: 'coal',
          name: 'Coal',
          category: 'resource',
          stack: 50,
          row: 0,
          fuel: {
            value: 4,
            category: 'chemical',
          },
        },
      ],
      recipes: [
        {
          id: 'iron-plate',
          name: 'Iron Plate',
          category: 'smelting',
          time: 3.2,
          in: {
            'iron-ore': 1,
          },
          out: {
            'iron-plate': 1,
          },
        },
      ],
    });
    const state = createState({
      inventory: {
        items: { 'iron-ore': 10 },
      },
      facilities: [
        {
          id: 'furnace-1',
          facilityId: 'stone-furnace',
          count: 1,
          targetItemId: 'iron-plate',
          status: 'running',
          efficiency: 1,
          production: {
            recipeId: 'iron-plate',
            progress: 0.25,
          },
          fuel: {
            itemId: 'coal',
            quantity: 1,
            remainingEnergy: 4,
          },
        },
      ],
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 10_000,
      deltaMs: 10_000,
    });

    expect(result.state.facilities[0].fuel).toEqual({
      itemId: 'coal',
      quantity: 1,
      remainingEnergy: 3,
    });
    expect(result.events).toEqual([]);
  });

  it('auto refuels no_fuel burner facilities from inventory during ticks', () => {
    const catalog = createCatalog({
      items: [
        {
          id: 'stone-furnace',
          name: 'Stone Furnace',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 1,
            type: 'burner',
            fuelCategories: ['chemical'],
            usage: 100,
            size: [2, 2],
            entityType: 'furnace',
          },
        },
        {
          id: 'coal',
          name: 'Coal',
          category: 'resource',
          stack: 50,
          row: 0,
          fuel: {
            value: 4,
            category: 'chemical',
          },
        },
      ],
    });
    const state = createState({
      inventory: {
        items: { coal: 1 },
      },
      facilities: [
        {
          id: 'furnace-1',
          facilityId: 'stone-furnace',
          count: 1,
          targetItemId: null,
          status: 'no_fuel',
          efficiency: 1,
          production: null,
          fuel: null,
        },
      ],
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 0,
      deltaMs: 0,
    });

    expect(result.state.inventory.items.coal).toBe(0);
    expect(result.state.facilities[0]).toMatchObject({
      status: 'running',
      fuel: {
        itemId: 'coal',
        quantity: 1,
        remainingEnergy: 4,
      },
    });
  });

  it('advances facility production, consumes inputs, and emits outputs', () => {
    const catalog = createCatalog({
      items: [
        {
          id: 'assembling-machine-1',
          name: 'Assembling Machine 1',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 0.5,
            type: 'electric',
            usage: 90,
            size: [3, 3],
            entityType: 'assembling-machine',
          },
        },

        {
          id: 'solar-panel',
          name: 'Solar Panel',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 0,
            type: 'electric',
            usage: 60,
            size: [3, 3],
            entityType: 'solar-panel',
          },
        },
      ],
      recipes: [
        {
          id: 'iron-gear-wheel',
          name: 'Iron Gear Wheel',
          category: 'crafting',
          time: 1,
          in: {
            'iron-plate': 2,
          },
          out: {
            'iron-gear-wheel': 1,
          },
        },
      ],
    });
    const state = createState({
      inventory: {
        items: {
          'iron-plate': 8,
        },
      },
      facilities: [
        {
          id: 'assembler-1',
          facilityId: 'assembling-machine-1',
          count: 2,
          targetItemId: 'iron-gear-wheel',
          status: 'running',
          efficiency: 1,
          production: {
            recipeId: 'iron-gear-wheel',
            progress: 0,
          },
          fuel: null,
        },

        {
          id: 'solar-1',
          facilityId: 'solar-panel',
          count: 3,
          targetItemId: null,
          status: 'running',
          efficiency: 1,
          production: null,
          fuel: null,
        },
      ],
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 2_000,
      deltaMs: 2_000,
    });

    expect(result.state.inventory.items['iron-plate']).toBe(0);
    expect(result.state.inventory.items['iron-gear-wheel']).toBe(2);
    expect(result.state.stats.totalItemsProduced).toBe(2);
    expect(result.state.facilities[0].production?.progress).toBeCloseTo(0.4, 2);
    expect(result.state.facilities[0].status).toBe('running');
  });

  it('marks facility as no_resource when recipe inputs are insufficient', () => {
    const catalog = createCatalog({
      items: [
        {
          id: 'assembling-machine-1',
          name: 'Assembling Machine 1',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 0.5,
            type: 'electric',
            usage: 90,
            size: [3, 3],
            entityType: 'assembling-machine',
          },
        },
        {
          id: 'solar-panel',
          name: 'Solar Panel',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 0,
            type: 'electric',
            usage: 60,
            size: [3, 3],
            entityType: 'solar-panel',
          },
        },
      ],
      recipes: [
        {
          id: 'iron-gear-wheel',
          name: 'Iron Gear Wheel',
          category: 'crafting',
          time: 1,
          in: {
            'iron-plate': 2,
          },
          out: {
            'iron-gear-wheel': 1,
          },
        },
      ],
    });
    const state = createState({
      inventory: {
        items: {
          'iron-plate': 1,
        },
      },
      facilities: [
        {
          id: 'assembler-1',
          facilityId: 'assembling-machine-1',
          count: 1,
          targetItemId: 'iron-gear-wheel',
          status: 'running',
          efficiency: 1,
          production: {
            recipeId: 'iron-gear-wheel',
            progress: 0,
          },
          fuel: null,
        },

        {
          id: 'solar-1',
          facilityId: 'solar-panel',
          count: 3,
          targetItemId: null,
          status: 'running',
          efficiency: 1,
          production: null,
          fuel: null,
        },
      ],
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 1_000,
      deltaMs: 1_000,
    });

    expect(result.state.facilities[0].status).toBe('no_resource');
    expect(result.state.inventory.items['iron-plate']).toBe(1);
    expect(result.events).toContainEqual({
      type: 'facility/no-resource',
      instanceId: 'assembler-1',
    });
  });

  it('keeps output_full facilities blocked until output-capacity handling is implemented', () => {
    const catalog = createCatalog({
      items: [
        {
          id: 'assembling-machine-1',
          name: 'Assembling Machine 1',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 0.5,
            type: 'electric',
            usage: 90,
            size: [3, 3],
            entityType: 'assembling-machine',
          },
        },
        {
          id: 'solar-panel',
          name: 'Solar Panel',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 0,
            type: 'electric',
            usage: 60,
            size: [3, 3],
            entityType: 'solar-panel',
          },
        },
      ],
      recipes: [
        {
          id: 'iron-gear-wheel',
          name: 'Iron Gear Wheel',
          category: 'crafting',
          time: 1,
          in: {
            'iron-plate': 2,
          },
          out: {
            'iron-gear-wheel': 1,
          },
        },
      ],
    });
    const state = createState({
      inventory: {
        items: {
          'iron-plate': 10,
          'iron-gear-wheel': 2,
        },
        capacities: {
          'iron-gear-wheel': 2,
        },
      },
      facilities: [
        {
          id: 'assembler-1',
          facilityId: 'assembling-machine-1',
          count: 1,
          targetItemId: 'iron-gear-wheel',
          status: 'output_full',
          efficiency: 1,
          production: {
            recipeId: 'iron-gear-wheel',
            progress: 1,
          },
          fuel: null,
        },
        {
          id: 'solar-1',
          facilityId: 'solar-panel',
          count: 3,
          targetItemId: null,
          status: 'running',
          efficiency: 1,
          production: null,
          fuel: null,
        },
      ],
    });

    const result = tickGame(state, {
      catalog,
      nowMs: 1_000,
      deltaMs: 1_000,
    });

    expect(result.state.facilities[0].status).toBe('output_full');
    expect(result.state.inventory.items['iron-plate']).toBe(10);
    expect(result.state.inventory.items['iron-gear-wheel']).toBe(2);
    expect(result.state.stats.totalItemsProduced).toBe(0);
    expect(result.events).toEqual([]);
  });

  it('recovers output_full facility when output capacity becomes available', () => {
    const catalog = createCatalog({
      items: [
        {
          id: 'assembling-machine-1',
          name: 'Assembling Machine 1',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 0.5,
            type: 'electric',
            usage: 90,
            size: [3, 3],
            entityType: 'assembling-machine',
          },
        },
        {
          id: 'solar-panel',
          name: 'Solar Panel',
          category: 'production',
          stack: 50,
          row: 0,
          machine: {
            speed: 0,
            type: 'electric',
            usage: 60,
            size: [3, 3],
            entityType: 'solar-panel',
          },
        },
      ],
      recipes: [
        {
          id: 'iron-gear-wheel',
          name: 'Iron Gear Wheel',
          category: 'crafting',
          time: 1,
          in: {
            'iron-plate': 2,
          },
          out: {
            'iron-gear-wheel': 1,
          },
        },
      ],
    });
    const baseState = createState({
      inventory: {
        items: {
          'iron-plate': 10,
          'iron-gear-wheel': 2,
        },
        capacities: {
          'iron-gear-wheel': 2,
        },
      },
      facilities: [
        {
          id: 'assembler-1',
          facilityId: 'assembling-machine-1',
          count: 1,
          targetItemId: 'iron-gear-wheel',
          status: 'output_full',
          efficiency: 1,
          production: {
            recipeId: 'iron-gear-wheel',
            progress: 1,
          },
          fuel: null,
        },
        {
          id: 'solar-1',
          facilityId: 'solar-panel',
          count: 3,
          targetItemId: null,
          status: 'running',
          efficiency: 1,
          production: null,
          fuel: null,
        },
      ],
    });

    const blocked = tickGame(baseState, {
      catalog,
      nowMs: 1_000,
      deltaMs: 1_000,
    });

    const resumed = tickGame(
      {
        ...blocked.state,
        inventory: {
          ...blocked.state.inventory,
          items: {
            ...blocked.state.inventory.items,
            'iron-gear-wheel': 1,
          },
        },
      },
      {
        catalog,
        nowMs: 2_000,
        deltaMs: 1_000,
      }
    );

    expect(resumed.state.facilities[0].status).toBe('running');
    expect(resumed.state.facilities[0].production?.progress).toBe(1);
    expect(resumed.state.inventory.items['iron-gear-wheel']).toBe(1);
    expect(resumed.state.stats.totalItemsProduced).toBe(0);

    const producedAfterRecovery = tickGame(resumed.state, {
      catalog,
      nowMs: 3_000,
      deltaMs: 1_000,
    });

    expect(producedAfterRecovery.state.facilities[0].status).toBe('output_full');
    expect(producedAfterRecovery.state.facilities[0].production?.progress).toBe(1);
    expect(producedAfterRecovery.state.inventory.items['iron-gear-wheel']).toBe(2);
    expect(producedAfterRecovery.state.stats.totalItemsProduced).toBe(1);
    expect(producedAfterRecovery.events).toContainEqual({
      type: 'facility/output-full',
      instanceId: 'assembler-1',
    });
  });
});
