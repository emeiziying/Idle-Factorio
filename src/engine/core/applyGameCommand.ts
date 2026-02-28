import type { GameCatalog } from '@/data/catalog/GameCatalog';
import type { GameCommand } from '@/engine/model/GameCommand';
import type { DomainEvent } from '@/engine/model/DomainEvent';
import type { GameState } from '@/engine/model/GameState';

export interface CommandContext {
  catalog: GameCatalog;
}

export interface CommandResult {
  state: GameState;
  events: DomainEvent[];
}

export const applyGameCommand = (
  state: GameState,
  command: GameCommand,
  _context: CommandContext
): CommandResult => {
  void command;

  // 首批骨架阶段保持 no-op，后续按子系统逐步迁入旧逻辑。
  return {
    state,
    events: [],
  };
};
