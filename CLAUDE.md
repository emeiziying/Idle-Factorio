# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Idle Factorio** - a React-based idle factory management game inspired by Factorio. The application is built with modern React architecture and implements core game mechanics for production management.

**Current State**: Active development - Core modules implemented
**Tech Stack**: React 19.1.0 + TypeScript + Vite + Material-UI v7.2.0 + Zustand + ahooks
**Package Manager**: pnpm (configured with pnpm@9.15.0)
**Homepage**: https://emeiziying.github.io/Idle-Factorio/

## Development Commands

```bash
# Start development server (with hot reload)
pnpm dev

# Build for production (TypeScript compilation + Vite build)
pnpm build

# Lint code (ESLint with TypeScript support)
pnpm lint

# Format code (Prettier)
pnpm format

# Check formatting (Prettier)
pnpm format:check

# Preview production build
pnpm preview

# Run tests (Vitest)
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test -- RecipeService

# Install dependencies
pnpm install
```

**Note**: Always run `pnpm lint` and `pnpm format` after making code changes to ensure TypeScript, React code quality, and consistent formatting.

## Git Workflow

The project uses **Husky** for pre-commit hooks:
- **Automatic formatting**: Code is automatically formatted with Prettier on commit
- **Linting**: ESLint checks are run automatically
- **Staged files only**: Only staged files are processed via lint-staged

## Critical Architecture Patterns

### Dependency Injection Pattern

The application uses a custom dependency injection container for service management:

```typescript
// Register and initialize services at startup via DIServiceInitializer
await DIServiceInitializer.initialize()

// Access services through DI container
const dataService = getService<DataService>(SERVICE_TOKENS.DATA_SERVICE);

// Or use React hooks in components
const dataService = useDataService();
const recipeService = useRecipeService();
```

**Initialization phases in DIServiceInitializer:**
1. **Phase 1**: Register all services with dependency declarations
2. **Phase 2**: Initialize core services (DataService, RecipeService, TechnologyService)
3. **Phase 3**: Initialize application layer (sync tech to store, start game loop)

**Key Features:**
- Reentrant initialization (safe for React StrictMode double-invocation)
- Centralized cleanup via `cleanup()` method
- Runtime port injection via `AppRuntimeContext`
- Proper error handling with automatic rollback

### Runtime Port Injection Pattern (AppRuntimeContext)

A key architectural pattern is injecting narrow service interfaces into non-React code (store slices, utilities) to avoid circular dependencies:

```typescript
// AppRuntimeContext provides typed accessor functions for runtime-injected ports
import { getStoreRuntimeServices, getStorageConfigQuery } from '@/services/core/AppRuntimeContext';

// In store slices or utilities (not React components):
const services = getStoreRuntimeServices(); // throws if not initialized
const recipeQuery = services.recipeQuery;

// Convenience accessors from storeRuntimeServices.ts:
import { getStoreDataQuery, getStoreFuelService } from '@/store/storeRuntimeServices';
```

**Context published during DIServiceInitializer Phase 3:**
- `storageConfigQuery` — Storage config methods from StorageService
- `inventoryDataQuery` — Item lookup from DataService
- `storeRuntimeServices` — Full runtime ports bundle for store slices
- `gameStoreAdapter` — Bridge from services to Zustand store actions
- `gameLoopRuntimePorts` — Recipe query for GameLoopTaskFactory

### Modular Zustand Store Architecture

The state management uses a modular slice-based architecture with `subscribeWithSelector`:

```
src/store/
├── index.ts                  # Composite store combining all slices
├── gameStore.ts              # Backward compatibility proxy
├── gameTimeStore.ts          # Separate game time tracking store
├── inventoryDataRuntime.ts   # Inventory data query runtime injection
├── storeRuntimeServices.ts   # Unified store service runtime injection
├── types/index.ts            # TypeScript interfaces for all slices
├── slices/                   # Individual business domain slices
│   ├── inventoryStore.ts         # Inventory & container management
│   ├── craftingStore.ts          # Crafting queue & chain crafting
│   ├── recipeStore.ts            # Recipe favorites & search
│   ├── facilityStore.ts          # Facilities & fuel system
│   ├── technologyStore.ts        # Technology tree & research
│   ├── gameMetaStore.ts          # Save/load & game metadata
│   ├── gameLoopStore.ts          # Game loop control & performance
│   └── uiStateStore.ts           # UI state (selected item, panels)
└── utils/mapSetHelpers.ts        # Map/Set serialization utilities
```

Each slice follows the Zustand StateCreator pattern:

```typescript
export const createInventorySlice: SliceCreator<InventorySlice> = (set, get) => ({
  // State properties
  inventory: new Map(),

  // Actions
  updateInventory: (itemId: string, amount: number) => { /* ... */ }
});
```

### Service Layer Business Logic Pattern

**Critical**: Always use services for business logic, never implement it in components:

```typescript
// ✅ Correct - use service methods
const recipes = recipeService.getRecipesThatProduce(itemId);
const isUnlocked = dataService.isItemUnlocked(itemId);

// ❌ Incorrect - business logic in components
const recipes = gameData.recipes.filter(r => r.out[itemId]);
```

### Advanced Chain Crafting System

The application implements sophisticated chain crafting with proper inventory management:

#### DependencyService Chain Analysis

```typescript
// Recursive calculation of total basic material needs
calculateTotalBasicMaterialNeeds(recipe, quantity, totalNeeds);

// Pre-validation of total materials before creating chain
analyzeCraftingChain(itemId, quantity, inventory): CraftingChainAnalysis | null;

// Returns null if insufficient total basic materials
// Example: Crafting 1 burner-mining-drill needs 3 gears + 3 iron-plates
```

#### Chain Crafting Execution Flow

```typescript
// 1. Pre-calculate total basic material requirements
// 2. Pre-deduct all basic materials from inventory immediately
// 3. Create chain tasks without additional material deduction
// 4. CraftingEngine skips material deduction for chain tasks (task.chainId exists)
// 5. Handle chain cancellation with full basic material refund

executeChainCrafting(chainAnalysis) {
  // Immediate basic material deduction prevents phantom crafting
  for (const [materialId, totalNeeded] of chainAnalysis.totalBasicMaterialNeeds) {
    updateInventory(materialId, -totalNeeded);
  }
}
```

### Technology Unlock System

The application implements a dynamic technology-based unlock system:

#### Dynamic Initial Unlock Logic

```typescript
// TechUnlockService automatically calculates initial unlocks based on game data
private async addInitialUnlocks(): Promise<void> {
  // 1. Load game data and scan for technology items
  const gameData = await this.dataService.loadGameData();

  // 2. Collect all recipes unlocked by technologies
  const techUnlockedRecipes = this.getTechUnlockedRecipes(gameData);

  // 3. Find recipes NOT in technology unlock lists = initially available
  const initialRecipes = allRecipes.filter(recipe => !techUnlockedRecipes.has(recipe.id));

  // 4. Extract items and buildings from initial recipes
  const initialItems = this.extractItemsFromRecipes(initialRecipes);
  const initialBuildings = this.extractBuildingsFromRecipes(initialRecipes);
}
```

#### Key Technology System Patterns

- **No Hardcoded Lists**: Initial unlocks are calculated from game data automatically
- **Technology Data Driven**: Scans `items` with `category: "technology"` and their `unlockedRecipes`
- **Dynamic Adaptation**: Updates automatically when game data changes
- **Event System**: `events.ts` broadcasts unlock changes to interested subscribers

## Import Path Standards

### **CRITICAL**: Use @/ alias for all internal imports in source code

```typescript
// ✅ Correct - use @/ alias
import { useGameStore } from '@/store/gameStore';
import { DataService } from '@/services/core/DataService';
import { ProductionModule } from '@/components/production/ProductionModule';

// ❌ Incorrect - avoid relative paths in source code
import { useGameStore } from '../store/gameStore';
import { DataService } from '../../services/core/DataService';
```

### **Exception**: Use relative paths in test files

```typescript
// ✅ Correct for test files - use relative paths
import { useCategoriesWithItems } from '../useCategoriesWithItems';
import { DataService } from '../../services/core/DataService';

// Mock paths should also be relative
vi.mock('../../services/core/DataService');
vi.mock('../../store/gameStore');
```

## Current Architecture

### Complete Service Layer

The application follows a service-oriented architecture with clear separation of concerns:

**Core Services** (`src/services/core/`):
- **AppRuntimeContext**: Unified runtime injection context — publishes typed ports for store slices and non-React code
- **DataService**: Singleton for game data loading, localization, item/recipe lookup
- **DIContainer**: Custom DI container with circular dependency detection and `dispose()` support
- **DIServiceInitializer**: Centralized service registration and initialization orchestration (reentrant-safe)
- **GameConfig**: Centralized game constants and configuration
- **ServiceTokens**: Constants for type-safe service lookup

**Crafting Services** (`src/services/crafting/`):
- **RecipeService**: Recipe querying (produce, consume, manual, automated) with unlock-aware filters
- **DependencyService**: Recursive material dependency analysis for chain crafting
- **FuelService**: Fuel buffer management and consumption calculation

**Game Services** (`src/services/game/`):
- **GameLoopService**: Unified requestAnimationFrame-based loop with task scheduling and `dispose()`
- **GameLoopTaskFactory**: Factory for creating default game system tasks
- **PowerService**: Power generation/consumption calculation and balance analysis
- **UserProgressService**: Item unlock status and progress tracking

**Technology Services** (`src/services/technology/`):
- **TechnologyService**: Main tech system coordinator
- **TechTreeService**: Tech tree structure, navigation, and dependency lookup
- **TechUnlockService**: Unlock state management (items, recipes, buildings)
- **ResearchService**: Current research progress and completion handling
- **ResearchQueueService**: Research queue ordering and management
- **TechProgressTracker**: Research progress state tracking
- **TechDataLoader**: Async technology data loading from game JSON
- **events.ts**: Event system broadcasting tech state changes
- **types.ts**: Technology system shared type definitions

**Storage Services** (`src/services/storage/`):
- **GameStorageService**: Save/load with LZ-String compression (70-80% reduction) and `dispose()`
- **StorageService**: Container/chest management for inventory expansion

**Service Interfaces** (`src/services/interfaces/`):
- **IManualCraftingValidator**: Interface for manual crafting validation

### Custom Hooks Pattern

Custom hooks in `src/hooks/` encapsulate complex state logic:

```typescript
// ✅ Good example - useCategoriesWithItems
export const useCategoriesWithItems = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-updates when technologies are unlocked
  return { categories, loading, refreshCategories };
};
```

**Key hooks:**
- `useAppInitialization` - App startup orchestration
- `useDIServices` - Service access hooks (`useDataService`, `useRecipeService`, etc.)
- `useCrafting` - Crafting logic
- `useCategoriesWithItems` - Category data fetching with auto-refresh
- `useItemRecipes` - Recipe retrieval for items
- `useItemClick` - Item interaction handling
- `useManualCraftingStatus` - Manual craft validation
- `useFacilityRepair` - Facility state integrity repair
- `useInventoryRepair` - Inventory state integrity repair
- `useUnlockedTechsRepair` - Tech unlock state repair
- `useI18n` - Localization
- `useIsMobile` - Responsive mobile detection

### Core Game Loop (Unified Architecture)

```typescript
// Modern requestAnimationFrame-based game loop via GameLoopService
const gameLoopService = GameLoopService.getInstance();

// Register tasks with the unified loop system
gameLoopService.addTask({
  id: 'production-update',
  callback: (deltaTime) => {
    facilities.forEach(facility => {
      if (hasRequiredInputs(facility) && hasPower(facility)) {
        consumeInputs(facility);
        addOutputsToInventory(facility);
      }
    });
  },
  interval: 1000, // Update every second
  priority: 'high'
});
```

## Directory Structure

```
src/
├── App.tsx                           # Main application component
├── main.tsx                          # Entry point
├── vite-env.d.ts                     # Vite environment type definitions
├── components/                       # React components (~43 TSX files)
│   ├── common/                       # Shared UI components
│   │   ├── FactorioIcon.tsx          # Sprite sheet-based icons
│   │   ├── CategoryTabs.tsx          # Tab navigation
│   │   ├── ChainCraftingDialog.tsx   # Chain crafting UI
│   │   ├── FloatingTaskList.tsx      # Floating task display
│   │   ├── ClickableWrapper.tsx      # Item click wrapper
│   │   ├── ClearGameButton.tsx       # Game reset button
│   │   ├── ErrorScreen.tsx           # Error display
│   │   ├── InlineLoading.tsx         # Inline loading spinner
│   │   ├── LoadingScreen.tsx         # Full-screen loader
│   │   └── index.ts                  # Common module exports
│   ├── detail/                       # Item detail panel components
│   │   ├── ItemDetailHeader.tsx      # Item header in detail panel
│   │   ├── UnifiedRecipeCard.tsx     # Combined production/consumption recipes
│   │   ├── ManualCraftingCard.tsx    # Manual crafting section
│   │   ├── ManualCraftingFlowCard.tsx # Advanced crafting flow
│   │   ├── CraftingButtons.tsx       # Craft action buttons
│   │   ├── RecipeFlowDisplay.tsx     # Input/output visualization
│   │   ├── InventoryCard.tsx         # Inventory display
│   │   ├── InventoryManagementCard.tsx # Inventory operations
│   │   ├── UsageCard.tsx             # Item usage tracking
│   │   ├── RecipeFacilitiesCard.tsx  # Production facilities list
│   │   └── StorageExpansionDialog.tsx # Storage upgrade UI
│   ├── facilities/                   # Facilities management
│   │   ├── FacilitiesModule.tsx      # Main facilities interface
│   │   ├── PowerManagement.tsx       # Power system UI
│   │   ├── FuelStatusDisplay.tsx     # Fuel management display
│   │   ├── FuelPrioritySettings.tsx  # Fuel priority configuration
│   │   ├── ProductionMonitor.tsx     # Facility production tracking
│   │   └── EfficiencyOptimizer.tsx   # Efficiency analysis
│   ├── production/                   # Production module
│   │   ├── ProductionModule.tsx      # Main production interface
│   │   ├── ItemGrid.tsx              # Item grid display
│   │   ├── ItemList.tsx              # Item list alternative view
│   │   ├── ItemCard.tsx              # Single item card
│   │   ├── ItemDetailPanel.tsx       # Item details
│   │   ├── CraftingQueue.tsx         # Active crafting tasks
│   │   └── RecipeInfo.tsx            # Recipe analysis display
│   └── technology/                   # Technology module
│       ├── TechnologyModule.tsx      # Main tech interface
│       ├── TechDetailPanel.tsx       # Tech detail view
│       ├── TechVirtualizedGridWithAutoSizer.tsx # Optimized grid with auto-sizing
│       ├── TechVirtualizedGrid.tsx   # Virtualized tech grid
│       ├── TechSimpleGrid.tsx        # Simple tech grid
│       ├── TechGridCard.tsx          # Single tech card
│       └── ResearchQueue.tsx         # Queue management
├── constants/
│   └── storageKeys.ts                # localStorage key constants
├── data/                             # Game data and configurations
│   ├── customRecipes.ts              # Custom recipe definitions
│   ├── fuelConfigs.ts                # Fuel system configuration
│   ├── storageConfigData.ts          # Storage configuration data
│   ├── storageConfigs.ts             # Storage config definitions
│   └── storageConfigRuntime.ts       # Storage config runtime injection
├── hooks/                            # Custom React hooks (12 files)
│   ├── useAppInitialization.ts       # App startup orchestration
│   ├── useDIServices.ts              # Service access hooks
│   ├── useCategoriesWithItems.ts     # Category data with auto-refresh
│   ├── useCrafting.ts                # Crafting logic
│   ├── useFacilityRepair.ts          # Facility state integrity repair
│   ├── useI18n.ts                    # Localization
│   ├── useInventoryRepair.ts         # Inventory state integrity repair
│   ├── useIsMobile.ts                # Responsive mobile detection
│   ├── useItemClick.ts               # Item interaction handling
│   ├── useItemRecipes.ts             # Recipe retrieval for items
│   ├── useManualCraftingStatus.ts    # Manual craft validation
│   └── useUnlockedTechsRepair.ts     # Tech unlock state repair
├── services/                         # Business logic services
│   ├── core/                         # DI container + core services (7 files)
│   │   ├── AppRuntimeContext.ts      # Unified runtime port injection context
│   │   ├── DataService.ts
│   │   ├── DIContainer.ts
│   │   ├── DIServiceInitializer.ts
│   │   ├── GameConfig.ts
│   │   ├── ServiceTokens.ts
│   │   └── index.ts
│   ├── crafting/                     # Recipe + dependency + fuel (4 files)
│   ├── game/                         # Game loop + power + progress (5 files)
│   ├── interfaces/                   # Service contracts
│   │   └── IManualCraftingValidator.ts
│   ├── storage/                      # Save/load + containers (3 files)
│   ├── technology/                   # Tech tree + research (10 files)
│   │   ├── TechnologyService.ts
│   │   ├── TechTreeService.ts
│   │   ├── TechUnlockService.ts
│   │   ├── ResearchService.ts
│   │   ├── ResearchQueueService.ts
│   │   ├── TechProgressTracker.ts
│   │   ├── TechDataLoader.ts
│   │   ├── events.ts                 # Tech event broadcasting
│   │   ├── types.ts                  # Technology type definitions
│   │   └── index.ts
│   └── index.ts
├── store/                            # Zustand state management
│   ├── index.ts                      # Composite store
│   ├── gameStore.ts                  # Backward compatibility proxy
│   ├── gameTimeStore.ts              # Game time tracking
│   ├── inventoryDataRuntime.ts       # Inventory data query runtime
│   ├── storeRuntimeServices.ts       # Store service runtime injection
│   ├── slices/                       # 8 modular slices
│   ├── types/index.ts                # Store TypeScript types
│   └── utils/mapSetHelpers.ts        # Map/Set serialization
├── test/
│   └── setup.ts                      # Vitest configuration and setup
├── theme/index.ts                    # Material-UI dark theme
├── types/                            # Shared TypeScript types
│   ├── index.ts                      # Core game types
│   ├── facilities.ts                 # Facility interfaces
│   ├── gameLoop.ts                   # Game loop types
│   ├── inventory.ts                  # Inventory types
│   ├── technology.ts                 # Technology system types
│   ├── mui-theme.d.ts                # Material-UI theme type extensions
│   └── test-utils.ts                 # Testing utility types
└── utils/                            # Utility functions
    ├── craftingEngine.ts             # Manual crafting logic
    ├── manualCraftingValidator.ts    # Validation logic
    ├── taskMerger.ts                 # Task merging logic
    ├── common.ts                     # Common utility functions
    ├── logger.ts                     # Logging system
    ├── navigation.ts                 # Navigation helpers
    └── styleHelpers.ts               # CSS/styling utilities
```

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
// DataService singleton pattern with async loading
const gameData = await dataService.loadGameData();

// Check data availability before UI rendering
if (dataService.isDataLoaded()) {
  // Safe to access game data
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
```

## UI Architecture & Patterns

### Mobile-First Design

- **Bottom Navigation**: Primary navigation with 3 active modules (Production, Facilities, Technology)
- **Material-UI Theme**: Custom dark theme optimized for mobile devices with extended type definitions in `types/mui-theme.d.ts`
- **Responsive Layout**: Flexible breakpoints and touch-friendly interactions
- **Virtualization**: `@tanstack/react-virtual` + `react-virtualized-auto-sizer` for large lists

### Key UI Components

- **FactorioIcon**: Sprite sheet-based icon rendering system
- **CategoryTabs**: Tab-based category navigation with dynamic content
- **ItemDetailPanel**: Right panel with recipe analysis and crafting options
- **ChainCraftingDialog**: Interactive chain crafting flow
- **TechVirtualizedGridWithAutoSizer**: Performance-optimized technology grid with auto-sizing
- **FloatingTaskList**: Floating overlay for active task display

### Component Patterns

- **Service Integration**: Components use DI hooks (`useDataService`, `useRecipeService`)
- **Zustand Integration**: `useGameStore()` hook for reactive state access
- **Async Data Loading**: Suspense-ready data loading with error boundaries
- **Performance Optimization**: React.memo and efficient re-rendering patterns

## Key Development Patterns

### Service Usage

```typescript
// Use DI hooks in React components
const dataService = useDataService();
const recipeService = useRecipeService();

// Use DI container in non-React code
const dataService = getService<DataService>(SERVICE_TOKENS.DATA_SERVICE);
const gameData = await dataService.loadGameData();
const item = dataService.getItemById(itemId);

const recipeService = getService<RecipeService>(SERVICE_TOKENS.RECIPE_SERVICE);
const recipes = recipeService.getRecipesThatProduce(itemId);
```

### Store Usage Patterns

```typescript
// Access store state and actions
const { inventory, addCraftingTask, updateInventory } = useGameStore();

// Use selectors for performance optimization
const favoriteRecipes = useGameStore(state => state.favoriteRecipes);
const craftingQueue = useGameStore(state => state.craftingQueue);

// Map/Set persistence handled automatically with repair mechanisms
```

### Runtime Port Injection (non-React code)

Store slices and utilities access services through runtime ports — **never import services directly** in store slices:

```typescript
// ✅ Correct - use runtime accessor in store slices
import { getStoreDataQuery, getStoreFuelService } from '@/store/storeRuntimeServices';

// Inside a store action:
const dataQuery = getStoreDataQuery();
const recipe = dataQuery.getRecipe(recipeId);

// ❌ Incorrect - direct service import in store slices creates circular deps
import { DataService } from '@/services/core/DataService';
```

### Testing Best Practices

- **Use relative paths** in test files for imports and mocks
- **Test coverage**: Aim for comprehensive testing with Vitest
- **Mock pattern**: Use proper TypeScript mocking for services
- **Integration tests**: Test complex workflows like crafting chains

## Development Guidelines

### Code Quality Configuration

- **ESLint**: Flat config (`eslint.config.js`) with TypeScript and React support
- **Prettier**: 100-character line width, single quotes, 2-space indentation
- **Husky + lint-staged**: Pre-commit hooks for automatic formatting and linting
- **TypeScript**: Strict mode enabled with `noUnusedLocals`, `noUnusedParameters`

### Build Configuration (Vite)

- **Base path**: `/Idle-Factorio/`
- **Path alias**: `@/` → `src/`
- **Manual chunk splitting**:
  - `react-vendor`: React/React-DOM
  - `mui-vendor`: Material-UI + Emotion
  - `virtualization-vendor`: TanStack + react-virtualized
  - `utils-vendor`: Zustand + lz-string
  - `services`: Service layer code
  - `components`: React components

### Performance Optimization

- Use React.memo for expensive renders
- Implement virtualization for large lists (`@tanstack/react-virtual`)
- Utilize DataService caching mechanisms
- Minimize re-renders with proper dependency arrays

### Component Development

- **Mobile-First**: Design for touch interactions and mobile viewports
- **Service Layer**: Use services for business logic, not components
- **Error Handling**: Implement proper loading states and error boundaries
- **Material-UI**: Follow established dark theme and component patterns

## Current Implementation Status

### Completed Systems ✅

- **Production Module**: Full crafting queue and inventory management
- **Recipe System**: Advanced analysis with efficiency calculations and unlock-aware filters
- **Data Management**: Async loading with internationalization (zh, ja)
- **State Persistence**: Zustand store with Map/Set serialization
- **Chain Crafting**: Sophisticated material pre-calculation system
- **Game Loop**: Unified requestAnimationFrame-based system with task scheduling
- **Storage System**: Optimized save/load with LZ-String compression
- **Technology System**: Full tree with research queue, unlock progression
- **Fuel System**: Fuel buffer management and consumption tracking
- **Power System**: Power balance calculation (PowerService)
- **Dependency Injection**: Custom DI container with 30+ registered services and disposal support
- **Runtime Port Injection**: AppRuntimeContext providing typed ports to store/utils
- **UI System**: 3-module mobile-first navigation

### In Progress 🚧

- **Facilities System**: Basic framework exists, power integration ongoing
- **Power UI**: PowerManagement component exists, full integration in progress

### Planned 📋 (see ROADMAP.md)

- **Logistics System**: Conveyor belts and automated transport
- **Blueprint System**: Save and share factory configurations
- **Achievements**: Goal tracking and rewards
- **Tutorial System**: New player onboarding
- **Cloud Saves**: Cross-device game persistence

## Testing Guidelines

The project uses **Vitest** with comprehensive test coverage:

- **Unit Tests**: Services, utilities, hooks, and components have dedicated test files
- **Integration Tests**: Complex workflows like crafting chains are integration tested
- **Test Location**: Tests are located in `__tests__` directories alongside source files
- **Coverage**: Run `pnpm test:coverage` to generate coverage reports
- **UI Testing**: Use `pnpm test:ui` for interactive test runner
- **Single Test**: Run `pnpm test -- RecipeService` to test specific files

### Testing Import Rules

```typescript
// ✅ Correct for test files - always use relative paths
import { DataService } from '../../services/core/DataService';
vi.mock('../../services/core/DataService');

// ❌ Incorrect for test files - avoid @/ alias in tests
import { DataService } from '@/services/core/DataService';
vi.mock('@/services/core/DataService');
```

## Documentation

Additional documentation lives in `/docs/`:

- `guides/development-guide.md` - Developer guide
- `systems/` - System design documents (fuel, storage, power, technology, logistics)
- `architecture/services/` - Service architecture and refactoring plans
- `ci-cd.md` - CI/CD pipeline documentation
- `design/` - UI and game design specifications

## Memories

### Service Initialization

- 所有的服务在启动时已经完成初始化，后续不需要再校验服务存不存在
