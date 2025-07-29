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

# Preview production build
pnpm preview

# Install dependencies
pnpm install
```

**Note**: Always run `pnpm lint` after making code changes to ensure TypeScript and React code quality.

## Current Architecture

### Implemented Service Layer Pattern
The application follows a service-oriented architecture with clear separation of concerns:

- **DataService**: Singleton pattern for game data loading from `/public/data/spa/`, inventory management
- **RecipeService**: Static class for recipe analysis, efficiency calculations, and dependency chains
- **UserProgressService**: Item unlock status management (implemented)
- **StorageService**: Storage configuration management with capacity and fluid handling
- **TechnologyService**: Technology tree management and research progression
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

### Service Layer Usage
```typescript
// Static service methods for business logic
const recipes = RecipeService.getRecipesThatProduce(itemId);
const efficiency = RecipeService.calculateRecipeEfficiency(recipe);

// Singleton data access
const gameData = await DataService.loadGameData();
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
- `第一阶段开发TODO.md` - Complete Phase 1 task checklist with progress tracking
- `第一阶段开发说明文档.md` - Detailed technical specifications and data structures
- `第一阶段开发任务文档.md` - Implementation roadmap and milestones

### System Design Documents  
- `物品解锁系统文档.md` - Item unlock mechanics and UserProgressService
- `电力系统设计文档.md` - Power generation/consumption balance system
- `科技页面设计文档.md` - Research tree and technology unlocking
- `设备管理系统文档.md` - Facility management and automation

### Game Design
- `异星工厂v2.md` & `异星工厂v3设计文档.md` - Overall game concept and progression (legacy design docs)
- `物品分类系统设计.md` - Item categorization strategy
- `物流系统功能设计.md` - Future logistics system (Phase 2+)

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

// Cost calculations
const rawCosts = RecipeService.calculateRawMaterialCosts(recipe);
const totalCosts = RecipeService.calculateTotalCosts(recipe);
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
- Main config: `tsconfig.json` with references to `tsconfig.app.json` and `tsconfig.node.json`
- Strict TypeScript checking enabled for type safety
- Import paths and module resolution configured for the project structure

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