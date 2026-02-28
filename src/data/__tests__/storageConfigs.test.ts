import { beforeEach, describe, expect, it } from 'vitest';
import { getAvailableChestTypes, getStorageConfig, getSolidStorageTypes } from '../storageConfigs';
import {
  resetStorageConfigQuery,
  setStorageConfigQuery,
  type StorageConfigQuery,
} from '../storageConfigRuntime';

const createStorageQuery = (): StorageConfigQuery => ({
  getStorageConfig: chestType =>
    chestType === 'iron-chest'
      ? {
          itemId: 'iron-chest',
          name: 'Iron Chest',
          category: 'solid',
          additionalStacks: 1,
          fluidCapacity: 0,
          recipe: { 'iron-plate': 8 },
          craftingTime: 0.5,
          description: '',
          dimensions: '1x1',
          requiredTechnology: undefined,
        }
      : undefined,
  getAvailableStorageTypes: () => ['iron-chest'],
  getSolidStorageTypes: () => ['iron-chest'],
  getLiquidStorageTypes: () => [],
  getChestConfig: chestType =>
    chestType === 'iron-chest'
      ? {
          itemId: 'iron-chest',
          name: 'Iron Chest',
          category: 'solid',
          additionalStacks: 1,
          fluidCapacity: 0,
          recipe: { 'iron-plate': 8 },
          craftingTime: 0.5,
          description: '',
          dimensions: '1x1',
          requiredTechnology: undefined,
        }
      : undefined,
  getAvailableChestTypes: () => ['iron-chest'],
});

describe('storageConfigs runtime query', () => {
  beforeEach(() => {
    resetStorageConfigQuery();
  });

  it('throws before the storage query is initialized', () => {
    expect(() => getStorageConfig('iron-chest')).toThrow(/not initialized/i);
  });

  it('delegates to the injected storage query', () => {
    setStorageConfigQuery(createStorageQuery());

    expect(getStorageConfig('iron-chest')?.name).toBe('Iron Chest');
    expect(getSolidStorageTypes()).toEqual(['iron-chest']);
    expect(getAvailableChestTypes()).toEqual(['iron-chest']);
  });
});
