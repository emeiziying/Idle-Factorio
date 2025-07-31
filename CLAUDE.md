# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Idle Factorio** - a React-based idle factory management game inspired by Factorio. The application is built with modern React architecture and implements core game mechanics for production management.

**Current State**: Active development - Core modules implemented  
**Tech Stack**: React 19.1.0 + TypeScript + Vite + Material-UI v7.2.0 + Zustand + ahooks  
**Package Manager**: pnpm (configured with pnpm@9.15.0)

## Development Commands

```bash
# Start development server (with hot reload)
pnpm dev

# Build for production (TypeScript compilation + Vite build)  
pnpm build

# Lint code (ESLint with TypeScript support)
pnpm lint

# Preview production build
pnpm preview

# Run tests (Vitest)
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run specific test files
pnpm test RecipeService
pnpm test DependencyService

# Check development server status
lsof -i :5173

# Install dependencies
pnpm install
```

**Note**: Always run `pnpm lint` after making code changes to ensure TypeScript and React code quality.

### Testing Guidelines
The project uses **Vitest** with comprehensive test coverage:
- **Unit Tests**: Services, utilities, hooks, and components have dedicated test files
- **Integration Tests**: Complex workflows like crafting chains are integration tested in `__tests__/integration/`
- **Test Location**: Tests are located in `__tests__` directories alongside source files
- **Test Configuration**: Uses `tsconfig.test.json` with path aliases (`@/` for `src/`)
- **Coverage**: Run `pnpm test:coverage` to generate coverage reports with custom exclusions
- **UI Testing**: Use `pnpm test:ui` for interactive test runner
- **Single Test**: Run `pnpm test RecipeService` to test specific files
- **Watch Mode**: Tests run in watch mode by default during development
- **Environment**: jsdom environment with global test utilities

### Development Server Guidelines
- **Priority**: Use existing dev server at `http://localhost:5173` if already running
- **Check existing**: Use `lsof -i :5173` to check for running services before starting new ones
- **Avoid duplicates**: Don't start multiple dev servers for the same project
- **Port fallback**: Vite will automatically use `http://localhost:5174` if 5173 is occupied

## Critical Architecture Patterns

### Service Locator Pattern
The application uses a service locator pattern for dependency injection:
```typescript
// Register services at startup via ServiceInitializer
ServiceInitializer.initialize()

// Access services through ServiceLocator
const dataService = ServiceLocator.get<DataService>(SERVICE_NAMES.DATA);
```

### Zustand State Management with Unified Storage
The gameStore.ts implements sophisticated Map/Set serialization with unified storage service:
- **Map types**: inventory, craftedItemCounts, builtEntityCounts, minedEntityCounts
- **Set types**: favoriteRecipes, unlockedTechs
- **Unified Storage**: GameStorageService handles optimization, compression, and persistence

### Service Layer Business Logic Pattern
**Critical**: Always use services for business logic, never implement it in components:
```typescript
// ✅ Correct - use service methods
const recipes = RecipeService.getRecipesThatProduce(itemId);
const isUnlocked = dataService.isItemUnlocked(itemId);

// ❌ Incorrect - business logic in components
const recipes = gameData.recipes.filter(r => r.out[itemId]);
```

### Advanced Chain Crafting System
The application implements sophisticated chain crafting with proper inventory management:

#### DependencyService Chain Analysis
```typescript
// Recursive calculation of total raw material needs
calculateTotalRawMaterialNeeds(recipe, quantity, totalNeeds);

// Pre-validation of total materials before creating chain
analyzeCraftingChain(itemId, quantity, inventory): CraftingChainAnalysis | null;

// Returns null if insufficient total raw materials
// Example: Crafting 1 burner-mining-drill needs 3 gears + 3 iron-plates
// 3 gears need 6 iron-plates, so total: 9 iron-plates required
```

#### Chain Crafting Execution Flow
```typescript
// 1. Pre-calculate total raw material requirements
// 2. Pre-deduct all raw materials from inventory immediately  
// 3. Create chain tasks without additional material deduction
// 4. CraftingEngine skips material deduction for chain tasks (task.chainId exists)
// 5. Handle chain cancellation with full raw material refund

executeChainCrafting(chainAnalysis) {
  // Immediate raw material deduction prevents phantom crafting
  for (const [materialId, totalNeeded] of chainAnalysis.totalRawMaterialNeeds) {
    updateInventory(materialId, -totalNeeded);
  }
}
```

## Current Architecture

### Implemented Service Layer Pattern
The application follows a service-oriented architecture with clear separation of concerns:

- **DataService**: Singleton pattern for game data loading from `/public/data/spa/`, inventory management
- **RecipeService**: Static class for recipe analysis, efficiency calculations, and dependency chains
- **UserProgressService**: Item unlock status management (implemented)
- **StorageService**: Storage configuration management with capacity and fluid handling
- **TechnologyService**: Technology tree management and research progression
- **GameStorageService**: Unified save/load operations with optimization and compression
- **GameConfig**: Centralized game constants and configuration management
- **GameStateAdapter**: Game state provider interface (registered as `GAME_STATE`)
- **ManualCraftingValidator**: Manual crafting validation logic (registered as `MANUAL_CRAFTING_VALIDATOR`)
- **FuelService**: Fuel consumption and management
- **PowerService**: Power generation and consumption balance
- **GameStore (Zustand)**: Reactive state management with localStorage persistence

### Phase 1 Implementation Status
Currently implemented core systems:
- ✅ Production Module: Item display, crafting queue, inventory management
- ✅ Game Data Loading: Async data loading with internationalization support
- ✅ Recipe System: Advanced recipe analysis and optimization
- ✅ State Persistence: Zustand store with Map/Set serialization
- 🚧 Facilities Module: Basic structure implemented
- 📋 Technology Module: Planned
- 📋 Power Module: Planned

### Core Game Loop (Phase 1)
```typescript
// Simplified production loop - no logistics constraints
setInterval(() => {
  facilities.forEach(facility => {
    if (hasRequiredInputs(facility) && hasPower(facility)) {
      consumeInputs(facility);
      addOutputsToInventory(facility);
    }
  });
}, 1000); // Update every second
```

### Current Component Structure

```
src/
├── components/
│   ├── common/          # FactorioIcon, CategoryTabs, reusable UI
│   ├── detail/          # Recipe cards and detail components
│   ├── production/      # ItemDetailPanel, RecipeAnalysis, RecipeInfo
│   ├── facilities/      # Facility management components (basic)
│   ├── technology/      # Technology tree (planned)
│   └── test/           # Development testing components
├── services/           # DataService, RecipeService, UserProgressService
├── store/             # gameStore.ts - Zustand state with persistence
├── types/             # TypeScript interfaces for game data
├── utils/             # customRecipeUtils, manualCraftingValidator
├── data/              # customRecipes.ts - Game-specific data
├── hooks/             # Custom React hooks (useCrafting, useIsMobile, etc.)
└── examples/          # Example/demo components
```

**Key Implementation Files**:
- `src/services/DataService.ts` - Singleton game data manager with i18n support
- `src/services/RecipeService.ts` - Advanced recipe analysis and optimization  
- `src/store/gameStore.ts` - Zustand store with Map/Set serialization
- `src/components/common/FactorioIcon.tsx` - Sprite sheet icon system
- `src/utils/craftingEngine.ts` - Core crafting logic and validation

### Implemented Module Architecture

1. **Production Module** (✅ Complete): 
   - Bottom navigation with CategoryTabs
   - ItemDetailPanel with recipe analysis
   - Crafting queue management with progress tracking
   - Inventory system with capacity limits

2. **Recipe System** (✅ Advanced):
   - Recipe efficiency calculations and optimization
   - Dependency chain analysis (recursive)
   - Cost calculations (raw materials + total costs)
   - Recipe categorization (manual/automated/mining/recycling)
   - Favorites and recent recipes tracking

3. **State Management** (✅ Sophisticated):
   - Zustand store with Map/Set support
   - localStorage persistence with custom serialization
   - Real-time inventory updates and crafting progress

## Game Data Structure

### Current Data Assets
- **Game Data**: `/public/data/spa/` - Processed game data with internationalization
  - `data.json` - Main game data (items, recipes, categories)
  - `i18n/zh.json`, `i18n/ja.json` - Localization files
  - `icons.webp` - Sprite sheet for all item icons
- **Custom Recipes**: `/src/data/customRecipes.ts` - Game-specific recipe modifications
- **Icons**: Sprite sheet-based icon system via FactorioIcon component

### Data Loading Architecture
```typescript
// DataService singleton pattern
const gameData = await DataService.loadGameData();

// Async data loading with error handling
export class DataService {
  private static instance: DataService;
  private static data: GameData | null = null;
  
  static async loadGameData(): Promise<GameData> {
    // Fetch from /public/data/spa/ with language support
  }
}
```

### Current State Management (Zustand)
```typescript
interface GameState {
  // Core systems
  inventory: Map<string, InventoryItem>;
  craftingQueue: CraftingTask[];
  facilities: FacilityInstance[];
  
  // Recipe management
  favoriteRecipes: Set<string>;
  recentRecipes: string[];
  
  // Game progression
  gameTime: number;
  totalItemsProduced: number;
  
  // Persistence: Auto-save to localStorage with Map/Set serialization support
}

// Advanced features:
// - Custom JSON serialization for Map/Set types
// - Recipe search and filtering
// - Crafting progress tracking
// - Inventory capacity management
```

## UI Architecture & Patterns

### Mobile-First Design
- **Bottom Navigation**: Primary navigation with 5 modules (Production, Facilities, Technology, etc.)
- **Material-UI Theme**: Custom dark theme optimized for mobile devices  
- **Responsive Layout**: Flexible breakpoints and touch-friendly interactions

### Key UI Components
- **FactorioIcon**: Sprite sheet-based icon rendering system
- **CategoryTabs**: Tab-based category navigation with dynamic content
- **ItemDetailPanel**: Right panel with recipe analysis and crafting options
- **RecipeAnalysis**: Advanced recipe efficiency visualization
- **CraftingQueue**: Real-time progress tracking and task management

### Component Patterns
- **Service Integration**: Components directly call service methods (DataService, RecipeService)
- **Zustand Integration**: useGameStore() hook for reactive state access
- **Async Data Loading**: Suspense-ready data loading with error boundaries
- **Performance Optimization**: React.memo and efficient re-rendering patterns

## Key Development Patterns

### Service Initialization Pattern
```typescript
// Services must be initialized before use via ServiceInitializer
await ServiceInitializer.initialize();

// Service Locator pattern - access through centralized registry
const dataService = ServiceLocator.get<DataService>(SERVICE_NAMES.DATA);
const recipeService = ServiceLocator.get<RecipeService>(SERVICE_NAMES.RECIPE);

// Static service methods for business logic
const recipes = RecipeService.getRecipesThatProduce(itemId);
const efficiency = RecipeService.calculateRecipeEfficiency(recipe);

// Singleton data access
const gameData = await dataService.loadGameData();
```

### Service Hooks Pattern
The application provides dedicated React hooks for clean service integration:
```typescript
// Use dedicated service hooks for clean component integration
const dataService = useDataService();
const recipeService = useRecipeService();
const technologyService = useTechnologyService();
const fuelService = useFuelService();
const powerService = usePowerService();
const storageService = useStorageService();
const userProgressService = useUserProgressService();

// Get multiple services at once
const { dataService, recipeService, technologyService } = useCommonServices();

// Generic service access
const gameStateProvider = useGameStateProvider();
const customService = useService<CustomService>('CustomService');

// Service hooks provide memoized instances with fallback to singletons
// They check ServiceLocator first, then fall back to getInstance() for compatibility
```

### State Management Pattern
```typescript
// Zustand store access
const { inventory, addCraftingTask, updateInventory } = useGameStore();

// Map/Set persistence handled automatically
const favoriteRecipes = useGameStore(state => state.favoriteRecipes);
```

## Key Documentation Files

### Development Planning
- `docs/guides/development-guide.md` - Comprehensive development guide including all phases

### System Design Documents  
- `docs/systems/物品解锁系统文档.md` - Item unlock mechanics and UserProgressService
- `docs/systems/电力系统设计文档.md` - Power generation/consumption balance system
- `docs/systems/科技页面设计文档.md` - Research tree and technology unlocking
- `docs/systems/设备管理系统文档.md` - Facility management and automation
- `docs/systems/storage-system.md` - Complete storage and save optimization system
- `docs/systems/fuel-system.md` - Complete fuel management system

### Game Design
- `docs/design/异星工厂v3设计文档.md` - Latest game design document
- `docs/design/物品分类系统设计.md` - Item categorization strategy
- `docs/design/UI设计说明文档.md` - UI/UX design specifications
- `docs/systems/物流系统功能设计.md` - Logistics system design

## Development Guidelines

### Current Implementation Focus
- ✅ **Production System**: Full crafting queue and inventory management
- ✅ **Recipe System**: Advanced analysis with efficiency calculations
- ✅ **Data Management**: Async loading with internationalization
- 🚧 **Facilities System**: Basic structure, needs power integration
- 📋 **Technology System**: Research tree and unlock progression
- 📋 **Power System**: Electricity generation/consumption balance

### Working with Services

#### DataService Usage
```typescript
// Always use singleton pattern
const gameData = await DataService.loadGameData();
const item = DataService.getItemById(itemId);

// Check data availability before UI rendering
if (DataService.isDataLoaded()) {
  // Safe to access game data
}
```

#### RecipeService Integration
```typescript
// Recipe analysis and optimization
const recipes = RecipeService.getRecipesThatProduce(itemId);
const mostEfficient = RecipeService.getMostEfficientRecipe(itemId);
const stats = RecipeService.getRecipeStats(itemId);

// Advanced features (700+ lines of methods)
const dependencyChain = RecipeService.getRecipeDependencyChain(recipe, maxDepth);
const complexityScore = RecipeService.getRecipeComplexityScore(recipe);
const recommendations = RecipeService.getRecipeRecommendations(itemId, unlockedItems, 'efficiency');
```

#### DependencyService for Chain Crafting
```typescript
// Critical for chain crafting - validates and calculates material needs
const dependencyService = DependencyService.getInstance();
const chainAnalysis = dependencyService.analyzeCraftingChain(itemId, quantity, inventory);

// Returns null if insufficient total raw materials (prevents phantom crafting)
if (chainAnalysis) {
  // Safe to execute chain crafting
  executeChainCrafting(chainAnalysis);
}
```

### State Management Best Practices
```typescript
// Prefer selector patterns for performance
const inventory = useGameStore(state => state.inventory);
const craftingQueue = useGameStore(state => state.craftingQueue);

// Use actions for state updates
const { updateInventory, addCraftingTask } = useGameStore();

// Handle Map/Set types correctly (auto-serialized)
const favoriteRecipes = useGameStore(state => state.favoriteRecipes); // Set<string>
```

### Component Development
- **Mobile-First**: Design for touch interactions and mobile viewports
- **Service Layer**: Use services for business logic, not components
- **Performance**: Utilize React.memo for expensive renders
- **Material-UI**: Follow established theme and component patterns
- **Error Handling**: Implement proper loading states and error boundaries

## Critical Development Patterns

### ESLint Configuration
The project uses ESLint 9 with modern flat config:
- Config: `eslint.config.js` with TypeScript ESLint v8+ integration
- Plugins: React hooks, React refresh, TypeScript recommended rules
- Target: Browser environment with ES2020
- **Always run `pnpm lint` before committing changes**

### TypeScript Configuration
The project uses a sophisticated multi-config TypeScript setup:
- **Main config**: `tsconfig.json` with project references for better build performance
- **Application config**: `tsconfig.app.json` for source code compilation
- **Node config**: `tsconfig.node.json` for build tools and configuration files
- **Test config**: `tsconfig.test.json` with path aliases (`@/` for `src/`) and test globals
- **Strict checking**: Enabled for type safety across all configurations
- **Path mapping**: Configured for clean imports and module resolution

### State Persistence Strategy
Zustand store implements custom serialization for complex types:
```typescript
// Map and Set types are serialized/deserialized automatically
favoriteRecipes: Set<string> // Persisted as array, restored as Set
inventory: Map<string, InventoryItem> // Persisted as entries array
```

### Service Integration Pattern
Services should be used for all business logic:
```typescript
// Correct - use service methods
const recipes = RecipeService.getRecipesThatProduce(itemId);
const item = DataService.getInstance().getItem(itemId);

// Incorrect - don't implement business logic in components
const recipes = gameData.recipes.filter(r => r.out[itemId]);
```

### Application Reliability Patterns
The application implements sophisticated reliability mechanisms for data integrity:

#### State Repair Hooks Pattern
```typescript
// These hooks automatically repair corrupted state on startup
useInventoryRepair();    // Repairs inventory Map structure
useUnlockedTechsRepair(); // Repairs unlockedTechs Set structure  
useFacilityRepair();     // Repairs facility targetItemId issues
```

#### Initialization Reliability
```typescript
// App.tsx implements promise caching to prevent duplicate initialization
const initializationRef = useRef<Promise<void> | null>(null);

// Safe startup with error boundaries
if (!initializationRef.current) {
  initializationRef.current = ServiceInitializer.initialize();
}

// Force save on page unload to prevent data loss
useEffect(() => {
  const handleUnload = () => {
    forceSaveGame(); // GameStorageService bypass debounce
  };
  window.addEventListener('beforeunload', handleUnload);
}, []);
```

#### ahooks Integration
The project extensively uses the `ahooks` library for React utilities:
```typescript
// Enhanced localStorage state management with ahooks
import { useLocalStorageState } from 'ahooks';

// Replaces manual localStorage handling with robust state management
const [gameSettings, setGameSettings] = useLocalStorageState('game-settings', {
  defaultValue: defaultSettings
});
```

#### Critical Fix Pattern for localStorage Map/Set Issues
```typescript
// gameStore.ts includes robust Map/Set serialization repair
const ensureMap = <K, V>(map: unknown, typeName: string): Map<K, V> => {
  if (map instanceof Map) return map;
  if (Array.isArray(map)) return new Map(map as [K, V][]);
  return new Map(); // fallback for corrupted data
};

// Applied during onRehydrateStorage for all Map/Set fields
state.inventory = ensureInventoryMap(state.inventory);
state.favoriteRecipes = new Set(state.favoriteRecipes);
```

### Unified Game Storage System
The application implements a sophisticated save system with GameStorageService that consolidates all storage operations:

#### GameStorageService Features
```typescript
// Unified storage with integrated optimization and compression
const gameStorageService = GameStorageService.getInstance();

// Features:
// - Integrated data structure optimization (50-60% reduction)
// - LZ-String compression (70-80% total reduction)
// - Automatic debouncing to prevent frequent writes
// - Map/Set serialization support
// - Force save and error recovery
```

#### Game Configuration Management
```typescript
// Centralized configuration via GameConfig
const gameConfig = GameConfig.getInstance();
const constants = gameConfig.getConstants();

// Centralized management of:
// - Crafting system constants (min time, intervals)
// - Fuel system settings (slots, thresholds)
// - Power system parameters (surplus, balance ratios)
// - Storage system defaults (stack sizes, capacity)
```

#### State Recovery Mechanism
```typescript
// Automatic Map/Set serialization repair
onRehydrateStorage: () => (state) => {
  state.inventory = ensureInventoryMap(state.inventory);
  state.favoriteRecipes = new Set(state.favoriteRecipes);
  state.unlockedTechs = ensureUnlockedTechsSet(state.unlockedTechs);
  // ... field validation and defaults
}
```

#### Save Methods
```typescript
// Regular save (automatic debouncing)
saveGame: () => {
  set(() => ({ saveKey: `save_${Date.now()}` }));
}

// Force save (bypass debounce via GameStorageService)
forceSaveGame: async () => {
  const gameStorageService = GameStorageService.getInstance();
  await gameStorageService.forceSave(state);
}

// Clear save (development only)
clearGameData: async () => {
  const gameStorageService = GameStorageService.getInstance();
  await gameStorageService.clearSave();
  set(() => ({ /* reset all state */ }));
  window.location.reload();
}
```

### Advanced Build Configuration
The project uses sophisticated Vite build optimization:

#### Manual Chunk Splitting Strategy
```typescript
// vite.config.ts implements strategic code splitting
manualChunks: (id) => {
  // Vendor chunks for optimal caching
  if (id.includes('react')) return 'react-vendor';
  if (id.includes('@mui')) return 'mui-vendor';
  if (id.includes('@tanstack')) return 'virtualization-vendor';
  if (id.includes('zustand')) return 'utils-vendor';
  
  // Game data chunks for lazy loading
  if (id.includes('data/spa/data.json')) return 'game-data';
  if (id.includes('data/spa/i18n/')) return 'i18n-data';
  if (id.includes('data/spa/icons.webp')) return 'game-assets';
  
  // Feature chunks
  if (id.includes('services/')) return 'services';
  if (id.includes('components/')) return 'components';
}
```

#### Asset Optimization
- **Image handling**: Optimized WebP asset chunking for game sprites
- **Dependency pre-building**: All major dependencies pre-configured for faster dev startup
- **Chunk size limits**: 1000kb warning threshold with strategic splitting
- **Source maps**: Disabled in production for smaller bundle size

### Browser Tools Integration
Specialized debugging support via browser tools (see .cursor/rules/):
- `takeScreenshot()` - Visual UI inspection
- `getConsoleErrors()` / `getConsoleLogs()` - Debug logging
- `runPerformanceAudit()` - Performance optimization
- Production module specific debugging patterns for CategoryTabs, ItemList, ItemDetailPanel, CraftingQueue

## Recent Critical Fixes

### Chain Crafting Inventory Logic (Fixed)
**Problem**: Chain crafting allowed phantom crafting with insufficient total raw materials.

**Example**: Crafting 1 burner-mining-drill needs 3 gears + 3 iron-plates. 3 gears need 6 iron-plates. Total: 9 iron-plates required, but system allowed crafting with only 6 iron-plates.

**Solution**: Implemented total raw material pre-calculation and immediate deduction:
1. `DependencyService.calculateTotalRawMaterialNeeds()` recursively calculates all raw materials
2. `analyzeCraftingChain()` validates total materials before allowing chain creation  
3. `executeChainCrafting()` immediately deducts all raw materials from inventory
4. `CraftingEngine` skips material deduction for chain tasks (`task.chainId` check)
5. Chain cancellation properly refunds all pre-deducted raw materials

**Files modified**: `DependencyService.ts`, `useCrafting.ts`, `gameStore.ts`, `craftingEngine.ts`, `types/index.ts`

### Recent Service Architecture Refactoring (Latest)
**Change**: Consolidated storage and configuration management into unified services.

**Improvements**:
1. **GameStorageService**: Unified save/load operations replacing separate SaveOptimizationService and DebouncedStorage
2. **GameConfig**: Centralized game constants management replacing scattered configuration
3. **Simplified gameStore**: Reduced complexity by moving storage logic to dedicated service
4. **Better separation of concerns**: Clear boundaries between state management and persistence

**Files affected**: `GameStorageService.ts`, `GameConfig.ts`, `gameStore.ts`, service layer refactoring

## Browser Debugging & UI Design Guidelines

### Browser Tools Integration
The project includes specialized browser debugging support via Cursor rules:
- **UI Inspection**: Use `takeScreenshot()`, `getConsoleErrors()`, `getConsoleLogs()` for debugging
- **Performance Monitoring**: `runPerformanceAudit()`, `runAccessibilityAudit()` for optimization
- **Production Module Debugging**: Specific patterns for checking CategoryTabs, ItemList, ItemDetailPanel, and CraftingQueue components

### UI Design System Compliance
Following established design patterns from `.cursor/rules/ui-design-system.mdc`:
- **Flat Design**: Avoid nested Card components, use Box with border instead of Divider
- **Color System**: Orange primary (#ff6b35), blue secondary (#2196f3), dark theme backgrounds
- **Spacing**: Use 8px-based spacing system (1, 1.5, 2, 3 units)
- **Icons**: Standardize FactorioIcon to 24px default size
- **Mobile-First**: 44px minimum touch targets, responsive breakpoints

### Component Debugging Checklist
For production module issues:
1. Check CategoryTabs layout and selection state
2. Verify ItemList categorization and selection 
3. Validate ItemDetailPanel layout and content
4. Test CraftingQueue display and interactions
5. Monitor console for initialization errors (avoid double-initialization)