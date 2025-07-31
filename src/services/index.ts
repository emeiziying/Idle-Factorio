// Core services - Service locator pattern and initialization
export {
  ServiceInitializer,
  ServiceLocator,
  GameConfig,
  SERVICE_NAMES
} from './core';

// Data services - Game data loading and recipe management
export {
  DataService,
  RecipeService,
  DependencyService
} from './data';

// Data service types
export type { CraftingChainAnalysis, CraftingDependency } from './data/DependencyService';

// Game logic services - Technology and user progress
export {
  TechnologyService,
  UserProgressService
} from './game-logic';

// System services - Fuel, power, and storage
export {
  FuelService,
  PowerService,
  StorageService,
  type GenericFuelBuffer
} from './systems';

// Storage services - Game state persistence and configuration
export {
  GameStorageService,
} from './storage';