// Core services - Service locator pattern and initialization
export {
  ServiceInitializer,
  ServiceLocator,
  SERVICE_NAMES
} from './core';

// Data services - Game data loading and recipe management
export {
  DataService,
  RecipeService,
  DependencyService
} from './data';

// Game logic services - Technology and user progress
export {
  TechnologyService,
  UserProgressService,
  GameStateAdapter
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
  GameConfig
} from './storage';