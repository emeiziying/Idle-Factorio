import type { SnapshotRepository } from '@/app/persistence/SnapshotRepository';
import { CURRENT_GAME_SNAPSHOT_VERSION, type GameSnapshot } from '@/engine/model/GameSnapshot';
import LZString from 'lz-string';

export const GAME_RUNTIME_SNAPSHOT_STORAGE_KEY = 'factorio-game-runtime-snapshot';

export interface LocalStorageSnapshotRepositoryOptions {
  storageKey?: string;
  storage?: Storage;
}

export class LocalStorageSnapshotRepository implements SnapshotRepository {
  private readonly storageKey: string;
  private readonly storage: Storage | null;

  constructor(options: LocalStorageSnapshotRepositoryOptions = {}) {
    this.storageKey = options.storageKey || GAME_RUNTIME_SNAPSHOT_STORAGE_KEY;
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  }

  async load(): Promise<GameSnapshot | null> {
    if (!this.storage) {
      return null;
    }

    const rawSnapshot = this.storage.getItem(this.storageKey);
    if (!rawSnapshot) {
      return null;
    }

    try {
      const serializedSnapshot = this.decompress(rawSnapshot);
      const parsed = JSON.parse(serializedSnapshot);

      if (!this.isGameSnapshot(parsed)) {
        console.warn('[GameSnapshotRepository] Invalid snapshot payload, ignoring persisted data');
        return null;
      }

      if (parsed.schemaVersion > CURRENT_GAME_SNAPSHOT_VERSION) {
        console.warn(
          `[GameSnapshotRepository] Detected newer snapshot schema v${parsed.schemaVersion}, loading in compatibility mode`
        );
      }

      return parsed;
    } catch (error) {
      console.error('[GameSnapshotRepository] Failed to load snapshot:', error);
      return null;
    }
  }

  async save(snapshot: GameSnapshot): Promise<void> {
    if (!this.storage) {
      return;
    }

    const serializedSnapshot = JSON.stringify(snapshot);
    const compressedSnapshot = LZString.compressToUTF16(serializedSnapshot);
    const finalSnapshot =
      compressedSnapshot.length * 2 < serializedSnapshot.length
        ? compressedSnapshot
        : serializedSnapshot;

    this.storage.setItem(this.storageKey, finalSnapshot);
  }

  async clear(): Promise<void> {
    this.storage?.removeItem(this.storageKey);
  }

  private decompress(rawSnapshot: string): string {
    if (!rawSnapshot.startsWith('ᯡ')) {
      return rawSnapshot;
    }

    return LZString.decompressFromUTF16(rawSnapshot) || rawSnapshot;
  }

  private isGameSnapshot(value: unknown): value is GameSnapshot {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    const snapshot = value as Record<string, unknown>;
    return (
      typeof snapshot.schemaVersion === 'number' &&
      typeof snapshot.savedAtMs === 'number' &&
      !!snapshot.state &&
      typeof snapshot.state === 'object' &&
      !Array.isArray(snapshot.state)
    );
  }
}

export const gameSnapshotRepository = new LocalStorageSnapshotRepository();
