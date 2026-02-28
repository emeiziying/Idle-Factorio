import type { GameCatalog } from '@/data/catalog/GameCatalog';
import type { GameCommand } from '@/engine/model/GameCommand';
import type { DomainEvent } from '@/engine/model/DomainEvent';
import type { GameState } from '@/engine/model/GameState';
import {
  queueResearch,
  removeQueuedResearch,
  setAutoResearch,
  startResearch,
} from '@/engine/core/researchState';

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
  context: CommandContext
): CommandResult => {
  switch (command.type) {
    case 'research/start':
      return {
        state: startResearch(state, command.techId, context.catalog),
        events: [],
      };

    case 'research/queue-add':
      return {
        state: queueResearch(state, command.techId, context.catalog),
        events: [],
      };

    case 'research/queue-remove':
      return {
        state: removeQueuedResearch(state, command.techId),
        events: [],
      };

    case 'research/auto-set':
      return {
        state: setAutoResearch(state, command.enabled),
        events: [],
      };

    default:
      // 非研究命令暂时保持 no-op，后续按子系统逐步迁入旧逻辑。
      return {
        state,
        events: [],
      };
  }
};
