# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Idle Factorio** - a React-based idle factory management game inspired by Factorio. The application is built with modern React architecture and implements core game mechanics for production management.

**Current State**: Active development - Core modules implemented  
**Tech Stack**: React 19.1.0 + TypeScript + Vite + Material-UI v7.2.0 + Zustand  
**Package Manager**: pnpm (configured with pnpm@9.15.0)

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
- **Staged files only**: Only staged files are processed for performance

## Critical Architecture Patterns

### Dependency Injection Container Pattern
The application uses a modern dependency injection container pattern:
```typescript
// Register services at startup via DIServiceInitializer
DIServiceInitializer.initialize()

// Access services through DI container
const dataService = getService<DataService>(SERVICE_TOKENS.DATA_SERVICE);

// Or in React components via hooks
const dataService = useDataService();
```

### Modular Zustand Store Architecture
The state management uses a modular slice-based architecture:

```
src/store/
├── index.ts              # Composite store combining all slices
├── gameStore.ts          # Backward compatibility proxy
├── types/index.ts        # TypeScript interfaces for all slices
├── slices/               # Individual business domain slices
│   ├── inventoryStore.ts     # Inventory & container management
│   ├── craftingStore.ts      # Crafting queue & chain crafting
│   ├── recipeStore.ts        # Recipe favorites & search
│   ├── facilityStore.ts      # Facilities & fuel system
│   ├── technologyStore.ts    # Technology tree & research
│   ├── gameMetaStore.ts      # Save/load & game metadata
│   └── gameLoopStore.ts      # Game loop control & performance
└── utils/mapSetHelpers.ts    # Map/Set serialization utilities
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

### Implemented Service Layer Pattern
The application follows a service-oriented architecture with clear separation of concerns:

- **DataService**: Singleton pattern for game data loading, category filtering, inventory management
- **RecipeService**: Static class for recipe analysis, efficiency calculations, and dependency chains
- **UserProgressService**: Item unlock status management
- **StorageService**: Storage configuration management with capacity and fluid handling
- **TechnologyService**: Technology tree management and research progression
- **GameLoopService**: Unified game loop using requestAnimationFrame with task scheduling
- **GameStorageService**: Unified save/load operations with optimization and compression
- **GameConfig**: Centralized game constants and configuration management

### Custom Hooks Pattern
Use custom hooks to encapsulate complex state logic:
```typescript
// ✅ Good example - useCategoriesWithItems
export const useCategoriesWithItems = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Auto-updates when technologies are unlocked
  return { categories, loading, refreshCategories };
};
```

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
const gameData = await DataService.loadGameData();

// Check data availability before UI rendering
if (DataService.isDataLoaded()) {
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

### Service Usage
```typescript
// Always use singleton pattern for DataService
const gameData = await DataService.loadGameData();
const item = DataService.getItemById(itemId);

// Use static methods for RecipeService
const recipes = RecipeService.getRecipesThatProduce(itemId);
const mostEfficient = RecipeService.getMostEfficientRecipe(itemId);
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

### Testing Best Practices
- **Use relative paths** in test files for imports and mocks
- **Test coverage**: Aim for comprehensive testing with Vitest
- **Mock pattern**: Use proper TypeScript mocking for services
- **Integration tests**: Test complex workflows like crafting chains

## Development Guidelines

### Code Quality Configuration
- **ESLint**: Flat config with TypeScript and React support
- **Prettier**: 100-character line width, single quotes, 2-space indentation
- **Husky**: Pre-commit hooks for automatic formatting and linting
- **TypeScript**: Strict mode enabled for type safety

### Performance Optimization
- Use React.memo for expensive renders
- Implement virtualization for large lists (@tanstack/react-virtual)
- Utilize DataService caching mechanisms
- Minimize re-renders with proper dependency arrays

### Component Development
- **Mobile-First**: Design for touch interactions and mobile viewports
- **Service Layer**: Use services for business logic, not components
- **Error Handling**: Implement proper loading states and error boundaries
- **Material-UI**: Follow established theme and component patterns

## Current Implementation Status

### Completed Systems ✅
- **Production Module**: Full crafting queue and inventory management
- **Recipe System**: Advanced analysis with efficiency calculations  
- **Data Management**: Async loading with internationalization
- **State Persistence**: Zustand store with Map/Set serialization
- **Chain Crafting**: Sophisticated material pre-calculation system
- **Game Loop**: Unified requestAnimationFrame-based system
- **Storage System**: Optimized save/load with compression

### In Progress 🚧
- **Facilities System**: Basic structure, needs power integration
- **Technology System**: Research tree and unlock progression

### Planned 📋
- **Power System**: Electricity generation/consumption balance
- **Advanced Automation**: Complex production chains

## Testing Guidelines

The project uses **Vitest** with comprehensive test coverage:
- **Unit Tests**: Services, utilities, hooks, and components have dedicated test files
- **Integration Tests**: Complex workflows like crafting chains are integration tested
- **Test Location**: Tests are located in `__tests__` directories alongside source files
- **Coverage**: Run `pnpm test:coverage` to generate coverage reports
- **UI Testing**: Use `pnpm test:ui` for interactive test runner
- **Single Test**: Run `pnpm test RecipeService` to test specific files

### Testing Import Rules
```typescript
// ✅ Correct for test files - always use relative paths
import { DataService } from '../../services/core/DataService';
vi.mock('../../services/core/DataService');

// ❌ Incorrect for test files - avoid @/ alias in tests
import { DataService } from '@/services/core/DataService';
vi.mock('@/services/core/DataService');
```