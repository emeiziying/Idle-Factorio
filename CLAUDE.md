# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **异星工厂 v2** (Factorio v2) - a React-based idle factory management game inspired by Factorio. This repository currently contains comprehensive planning documentation and game data, but the React application has not been implemented yet.

**Current State**: Documentation and planning phase  
**Target Implementation**: React + TypeScript + Material-UI + Zustand

## Project Initialization Commands

Since the React application doesn't exist yet, these commands will create the initial project structure:

```bash
# Create React app with TypeScript
npx create-react-app idle-factorio --template typescript

# Navigate to project directory
cd idle-factorio

# Install additional dependencies
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install zustand

# Install development dependencies
npm install --save-dev @types/node

# Start development server (once created)
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Planned Architecture

### Phase 1 Simplified Design
According to documentation, Phase 1 will **NOT** implement complex logistics-driven production. Instead:
- Facilities automatically obtain required materials from inventory
- Facilities automatically add outputs to inventory  
- No logistics capacity constraints or bottleneck calculations

### Service Layer Pattern (Planned)
The application will follow a service-based architecture:

- **DataService**: Game data loading from `/data/1.1/data.json`, inventory management
- **UserProgressService**: Item unlock status, localStorage persistence  
- **FacilityService**: Production facility management, automated production
- **PowerService**: Electricity generation/consumption balance
- **PersistenceService**: Auto-save every 30 seconds, import/export

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

### Planned Component Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── production/      # Item display, crafting, inventory
│   ├── facilities/      # Facility management, power dashboard  
│   └── technology/      # Research tree, science packs
├── services/            # Business logic services
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
└── utils/              # Helper functions, formatting
```

### Core Module Types (Planned)

1. **Production Module**: Item categories, crafting queue, inventory management
2. **Facilities Module**: Building management, power system, automated production
3. **Technology Module**: Research tree, item/recipe unlocking
4. **Power Module**: Electricity generation/consumption balance

## Game Data Structure

### Existing Data Assets
- **Game Data**: `/data/1.1/data.json` - Complete Factorio 1.1.107 item/recipe data
- **Icons**: `/data/1.1/icons.webp` - Sprite sheet for game icons
- **Hash File**: `/data/1.1/hash.json` - Data integrity verification

### Data Loading Pattern
```typescript
// Copy data assets to React public folder
// Load via fetch from /public/data/1.1/data.json
const gameData = await DataService.loadGameData();
```

### State Management (Zustand)
```typescript
interface GameStore {
  inventory: Map<string, number>;
  facilities: FacilityInstance[];
  unlockedItems: Set<string>;
  powerGrid: PowerState;
  // Auto-save every 30 seconds to localStorage
}
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
- `异星工厂v2.md` & `异星工厂v3设计文档.md` - Overall game concept and progression
- `物品分类系统设计.md` - Item categorization strategy
- `物流系统功能设计.md` - Future logistics system (Phase 2+)

## Development Guidelines

### Phase 1 Constraints
- **NO** complex logistics calculations - facilities work automatically
- **NO** input/output capacity limits - direct inventory access
- **NO** belt/transport systems - items teleport between facilities
- **Focus on**: Basic UI, crafting, facility management, power balance

### Working with Game Data
```typescript
// Data structure from /data/1.1/data.json
interface Item {
  id: string;
  name: string; 
  category: string;
  // Copy data to React public folder for fetch access
}
```

### Item Unlock System
Items start locked - use `UserProgressService` to manage unlock states:
```typescript
// Only show unlocked items in UI
const unlockedItems = gameData.items.filter(item => 
  UserProgressService.isItemUnlocked(item.id)
);
```

### Testing Strategy
- Use Create React App's Jest + React Testing Library setup
- Focus on service layer unit tests for game logic
- Component integration tests for user workflows
- Test unlock progression and power balance edge cases