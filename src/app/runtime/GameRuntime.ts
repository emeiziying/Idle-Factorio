import type { SnapshotRepository } from '@/app/persistence/SnapshotRepository';
import type { GameCatalog } from '@/data/catalog/GameCatalog';
import { applyGameCommand } from '@/engine/core/applyGameCommand';
import { tickGame } from '@/engine/core/tickGame';
import { CURRENT_GAME_SNAPSHOT_VERSION, type GameSnapshot } from '@/engine/model/GameSnapshot';
import type { GameCommand } from '@/engine/model/GameCommand';
import type { DomainEvent } from '@/engine/model/DomainEvent';
import type { GameState } from '@/engine/model/GameState';

export interface GameRuntimeOptions {
  catalog: GameCatalog;
  initialState: GameState;
  repository?: SnapshotRepository;
  now?: () => number;
}

export type GameRuntimeListener = (state: GameState, events: readonly DomainEvent[]) => void;

export class GameRuntime {
  private state: GameState;
  private readonly catalog: GameCatalog;
  private readonly repository?: SnapshotRepository;
  private readonly now: () => number;
  private readonly listeners = new Set<GameRuntimeListener>();

  constructor(options: GameRuntimeOptions) {
    this.state = options.initialState;
    this.catalog = options.catalog;
    this.repository = options.repository;
    this.now = options.now || (() => Date.now());
  }

  getState(): GameState {
    return this.state;
  }

  getCatalog(): GameCatalog {
    return this.catalog;
  }

  subscribe(listener: GameRuntimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(command: GameCommand): void {
    const result = applyGameCommand(this.state, command, {
      catalog: this.catalog,
    });
    this.state = result.state;
    this.emit(result.events);
  }

  tick(deltaMs: number): void {
    const result = tickGame(this.state, {
      nowMs: this.now(),
      deltaMs,
      catalog: this.catalog,
    });
    this.state = result.state;
    this.emit(result.events);
  }

  async save(): Promise<void> {
    if (!this.repository) {
      return;
    }

    const snapshot: GameSnapshot = {
      schemaVersion: CURRENT_GAME_SNAPSHOT_VERSION,
      savedAtMs: this.now(),
      state: this.state,
    };

    await this.repository.save(snapshot);
  }

  private emit(events: readonly DomainEvent[]): void {
    this.listeners.forEach(listener => {
      listener(this.state, events);
    });
  }
}
