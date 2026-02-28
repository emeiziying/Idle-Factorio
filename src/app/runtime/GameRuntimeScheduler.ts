import type { GameRuntime } from '@/app/runtime/GameRuntime';

export interface GameRuntimeSchedulerOptions {
  runtime: GameRuntime;
  tickIntervalMs?: number;
  autosaveIntervalMs?: number;
  now?: () => number;
}

export class GameRuntimeScheduler {
  private readonly runtime: GameRuntime;
  private readonly tickIntervalMs: number;
  private readonly autosaveIntervalMs: number;
  private readonly now: () => number;
  private tickTimerId: ReturnType<typeof setInterval> | null = null;
  private autosaveTimerId: ReturnType<typeof setInterval> | null = null;
  private lastTickAtMs: number | null = null;

  constructor(options: GameRuntimeSchedulerOptions) {
    this.runtime = options.runtime;
    this.tickIntervalMs = options.tickIntervalMs ?? 1000;
    this.autosaveIntervalMs = options.autosaveIntervalMs ?? 30000;
    this.now = options.now || (() => Date.now());
  }

  start(): void {
    if (this.tickTimerId !== null) {
      return;
    }

    this.lastTickAtMs = this.now();
    this.tickTimerId = setInterval(() => {
      this.runTick();
    }, this.tickIntervalMs);

    if (this.autosaveIntervalMs > 0) {
      this.autosaveTimerId = setInterval(() => {
        void this.runAutosave();
      }, this.autosaveIntervalMs);
    }
  }

  stop(): void {
    if (this.tickTimerId !== null) {
      clearInterval(this.tickTimerId);
      this.tickTimerId = null;
    }

    if (this.autosaveTimerId !== null) {
      clearInterval(this.autosaveTimerId);
      this.autosaveTimerId = null;
    }

    this.lastTickAtMs = null;
  }

  private runTick(): void {
    const currentNow = this.now();
    const previousTickAtMs = this.lastTickAtMs ?? currentNow;
    const deltaMs = Math.max(this.tickIntervalMs, currentNow - previousTickAtMs);

    this.lastTickAtMs = currentNow;
    this.runtime.tick(deltaMs);
  }

  private async runAutosave(): Promise<void> {
    try {
      await this.runtime.save();
    } catch (error) {
      console.warn('[GameRuntimeScheduler] Failed to autosave runtime snapshot:', error);
    }
  }
}
