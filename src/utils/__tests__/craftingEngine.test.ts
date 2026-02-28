import { describe, expect, it, vi } from 'vitest';
import CraftingEngine, { type CraftingEngineAdapter } from '../craftingEngine';
import type { Recipe } from '@/types';

const createAdapter = (queue = [] as Array<Record<string, unknown>>): CraftingEngineAdapter => ({
  getCraftingQueue: vi.fn(() => queue as never),
  updateCraftingProgress: vi.fn(),
  updateInventory: vi.fn(),
  completeCraftingTask: vi.fn(),
  trackMinedEntity: vi.fn(),
});

describe('CraftingEngine', () => {
  it('initializes task start time through the injected adapter', () => {
    const adapter = createAdapter([
      {
        id: 'task-1',
        recipeId: 'iron-plate',
        itemId: 'iron-plate',
        quantity: 2,
        startTime: 0,
        status: 'pending',
      },
    ]);
    const recipeLookup = {
      getRecipeById: vi.fn<(_: string) => Recipe | undefined>(() => ({
        id: 'iron-plate',
        name: 'Iron Plate',
        category: 'smelting',
        time: 3.2,
        in: { 'iron-ore': 1 },
        out: { 'iron-plate': 1 },
      })),
    };

    CraftingEngine.updateCraftingQueue(adapter, recipeLookup, 12345);

    expect(adapter.updateCraftingProgress).toHaveBeenCalledWith('task-1', 0, 12345);
    expect(recipeLookup.getRecipeById).toHaveBeenCalledWith('iron-plate');
  });

  it('completes finished mining tasks without touching the container', () => {
    const adapter = createAdapter([
      {
        id: 'task-2',
        recipeId: 'iron-ore-mining',
        itemId: 'iron-ore',
        quantity: 1,
        startTime: 1000,
        status: 'crafting',
      },
    ]);
    const recipeLookup = {
      getRecipeById: vi.fn<(_: string) => Recipe | undefined>(() => ({
        id: 'iron-ore-mining',
        name: 'Iron Ore',
        category: 'mining',
        time: 1,
        in: {},
        out: { 'iron-ore': 1 },
        flags: ['mining'],
      })),
    };

    CraftingEngine.updateCraftingQueue(adapter, recipeLookup, 4000);

    expect(adapter.updateCraftingProgress).toHaveBeenCalledWith('task-2', 100);
    expect(adapter.trackMinedEntity).toHaveBeenCalledWith('iron-ore', 1);
    expect(adapter.completeCraftingTask).toHaveBeenCalledWith('task-2');
    expect(adapter.updateInventory).not.toHaveBeenCalled();
  });
});
