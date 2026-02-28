import type { Category, GameData, Item, Recipe } from '@/types';

export interface GameCatalog {
  readonly data: GameData;
  readonly itemsById: ReadonlyMap<string, Item>;
  readonly recipesById: ReadonlyMap<string, Recipe>;
  readonly recipesByOutput: ReadonlyMap<string, readonly Recipe[]>;
  readonly categoriesById: ReadonlyMap<string, Category>;
}
