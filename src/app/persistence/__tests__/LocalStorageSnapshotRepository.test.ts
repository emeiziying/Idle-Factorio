import {
  GAME_RUNTIME_SNAPSHOT_STORAGE_KEY,
  LocalStorageSnapshotRepository,
} from '@/app/persistence/LocalStorageSnapshotRepository';
import { CURRENT_GAME_SNAPSHOT_VERSION } from '@/engine/model/GameSnapshot';
import { describe, expect, it } from 'vitest';

const createMemoryStorage = (): Storage => {
  const data = new Map<string, string>();

  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
};

describe('LocalStorageSnapshotRepository', () => {
  it('migrates older runtime snapshots by backfilling facility count', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      GAME_RUNTIME_SNAPSHOT_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        savedAtMs: 1_000,
        state: {
          simulationTimeMs: 0,
          inventory: {
            items: {},
          },
          facilities: [
            {
              id: 'furnace-1',
              facilityId: 'stone-furnace',
              targetItemId: null,
              status: 'running',
              efficiency: 1,
              production: null,
              fuel: null,
            },
          ],
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
        },
      })
    );
    const repository = new LocalStorageSnapshotRepository({ storage });

    const snapshot = await repository.load();

    expect(snapshot).not.toBeNull();
    expect(snapshot?.schemaVersion).toBe(CURRENT_GAME_SNAPSHOT_VERSION);
    expect(snapshot?.state.facilities[0]).toMatchObject({
      id: 'furnace-1',
      facilityId: 'stone-furnace',
      count: 1,
    });
  });
});
