import type { Category, GameData, Item, Recipe } from '@/types';
import type { Technology } from '@/types/technology';

export interface GameCatalog {
  readonly data: GameData;
  readonly itemsById: ReadonlyMap<string, Item>;
  readonly recipesById: ReadonlyMap<string, Recipe>;
  readonly recipesByOutput: ReadonlyMap<string, readonly Recipe[]>;
  readonly categoriesById: ReadonlyMap<string, Category>;
  readonly technologiesById: ReadonlyMap<string, Technology>;
  readonly technologiesInOrder: readonly Technology[];
}
