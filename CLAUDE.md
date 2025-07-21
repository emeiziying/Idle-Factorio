# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **异星工厂 v2** (Factorio v2) - a React-based idle factory management game inspired by Factorio. The game implements a logistics-driven production system where production efficiency is calculated as `MIN(base_capacity, input_logistics_capacity, output_logistics_capacity)`.

**Main Project Directory**: `/demo/` - This contains the actual React application.

## Development Commands

```bash
# Navigate to the demo directory first
cd demo

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject (if needed)
npm eject
```

## Architecture Overview

### Service Layer Pattern
The application follows a service-based architecture with clear separation of concerns:

- **DataService** (`demo/src/services/DataService.ts`): Game data loading, inventory management, crafting queue
- **SimpleLogisticsService** (`demo/src/services/SimpleLogisticsService.ts`): Logistics efficiency calculations, optimization recommendations
- **FacilityService** (`demo/src/services/FacilityService.ts`): Production facility management, recipe matching
- **PersistenceService** (`demo/src/services/PersistenceService.ts`): Auto-save, data persistence, import/export

### Core Calculation Engine

The game's core logic revolves around **logistics-driven production efficiency**:

```typescript
// Key formula in SimpleLogisticsService.ts:38-42
actualProduction = min(
  baseProduction,
  inputLogisticsCapacity,
  outputLogisticsCapacity
)
efficiency = actualProduction / baseProduction
```

### Component Structure

- **App.tsx**: Main application entry point with theme and state management
- **CategoryTabs.tsx**: Navigation between item categories (logistics, production, etc.)
- **FacilityLogisticsPanel.tsx**: Core UI for configuring facility logistics
- **FacilityOverview.tsx**: Dashboard view of all production facilities
- **ProductionChainAnalyzer.tsx**: Visualizes complete production chains

### Type System

- **types/index.ts**: Core game types (Item, Recipe, InventoryItem, etc.)
- **types/logistics.ts**: Logistics system types (LogisticsConfig, FacilityLogistics)
- **types/facilities.ts**: Facility definitions and production types

## Data Architecture

### Game Data Loading
- Data loaded from `/public/data/1.1/data.json` (Factorio game data)
- Icons served from `/public/data/1.1/icons.webp` sprite sheet
- Service pattern: `DataService.loadGameData()` → initialize other services

### State Management
- React hooks + service instances (no Redux/Context needed)
- Auto-save every 30 seconds via `PersistenceService`
- State flows: User Action → Service Method → State Update → React Re-render

### Performance Optimizations
- `React.memo` for expensive components like `ItemCard`
- `useMemo`/`useCallback` for calculation caching
- Debounced updates in logistics calculations
- Batched state updates for inventory changes

## Key Development Patterns

### Adding New Logistics Features
1. Update logistics types in `types/logistics.ts`
2. Implement calculation logic in `SimpleLogisticsService`
3. Add UI components in `components/`
4. Test efficiency calculations thoroughly

### Adding New Facility Types
1. Define in `FACILITY_TYPES` constant in `types/facilities.ts`
2. Update `FacilityService.getDefaultFacilityForRecipe()`
3. Ensure proper recipe matching and production calculations

### Working with Game Data
- Always check `gameData` is loaded before accessing items/recipes
- Use `DataService` methods for inventory operations
- Respect the async nature of data loading in components

## Testing Strategy

The project uses Create React App's default testing setup:
- Jest for unit tests
- React Testing Library for component tests
- Test files: `*.test.tsx` alongside components

## Important Implementation Details

### Logistics Calculation Logic
The `SimpleLogisticsService.updateFacilityLogistics()` method is the heart of the game's mechanics. It:
1. Calculates total facility requirements
2. Computes actual logistics capacity
3. Determines bottlenecks (input vs output)
4. Returns efficiency percentage

### Auto-Save Mechanism
- Enabled in `App.tsx` on initialization
- Saves every 30 seconds via `PersistenceService.enableAutoSave()`
- Persists logistics configurations, inventory, and facility states

### Performance Considerations
- The game updates inventory every second in `App.tsx:105-112`
- Logistics calculations are debounced to prevent excessive computation
- Use React dev tools to profile render performance when adding features

## Common Development Tasks

### Adding a New Item Category
1. Update `categoryTabs` in `types/index.ts`
2. Add category handling in `CategoryTabs.tsx`
3. Ensure `DataService.getItemsByCategory()` works with new category

### Modifying Logistics Formulas
- Primary logic in `SimpleLogisticsService.calculateLogisticsCapacity()`
- Update efficiency calculations in `updateFacilityLogistics()`
- Test edge cases (zero production, infinite capacity, etc.)

### Adding New UI Components
- Follow Material-UI patterns established in existing components
- Use React.memo for performance-critical components
- Implement proper TypeScript interfaces for props