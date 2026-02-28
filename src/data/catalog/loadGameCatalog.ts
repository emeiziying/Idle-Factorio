import { buildGameCatalog } from '@/data/catalog/buildGameCatalog';
import type { GameCatalog } from '@/data/catalog/GameCatalog';
import gameData from '@/data/spa/data.json';
import type { GameData } from '@/types';

let cachedCatalog: GameCatalog | null = null;

const getOrBuildGameCatalog = (): GameCatalog => {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  cachedCatalog = buildGameCatalog(gameData as unknown as GameData);
  return cachedCatalog;
};

export const getGameCatalog = (): GameCatalog => {
  return getOrBuildGameCatalog();
};

export const loadGameCatalog = async (): Promise<GameCatalog> => {
  return getOrBuildGameCatalog();
};

export const resetGameCatalog = (): void => {
  cachedCatalog = null;
};
