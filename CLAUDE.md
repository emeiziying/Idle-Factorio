# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Factorio-inspired idle game** project implemented in TypeScript/JavaScript. The game features automated production chains, resource management, and progression systems similar to Factorio but adapted for idle/incremental gameplay.

### Key Design Principles

- **Data-Driven Architecture**: All game content (items, recipes, technologies, machines) loads dynamically from `data.json` to avoid hardcoding
- **Offline Progress**: Game continues running when players are away, calculating progress upon return
- **Production Automation**: Complex production chains with automatic resource flow between facilities
- **Modular Systems**: Separate systems for resources, production, technology, energy, and storage

## Project Structure

```
/data/spa/              # Game data files
├── data.json          # Complete Factorio game data (712KB+, items, recipes, technologies)  
├── defaults.json      # Default settings and presets for different game configurations
├── hash.json          # Hash mappings and quality system data
├── i18n/             # Internationalization files
│   ├── ja.json       # Japanese translations
│   └── zh.json       # Chinese translations
└── icons.webp        # Sprite sheet for game icons (66px grid system)

/.kiro/specs/factorio-idle-game/  # Design documents
├── requirements.md   # Detailed game requirements and user stories
├── design.md        # Technical architecture and system design
└── tasks.md         # Implementation roadmap and task breakdown
```

## Core Systems Architecture

The game follows a modular architecture with these key systems:

### 1. Data Layer (`data.json`)
- Contains complete Factorio data structure
- Items categorized by type (logistics, production, combat, etc.)
- Recipes with input/output requirements and processing times
- Technology tree with prerequisites and unlocks
- Machine specifications and capabilities

### 2. Resource System
- Manages all resource storage and flow
- Tracks production rates and consumption
- Handles inventory limits and overflow

### 3. Production System  
- Automated facility management
- Recipe processing and efficiency calculations
- Power consumption and fuel management
- Production chain optimization

### 4. Energy System
- Power generation from multiple sources (steam, solar, nuclear)
- Power distribution and consumption tracking
- Accumulator (battery) storage system
- Power shortage handling (reduced efficiency)

### 5. Technology System
- Research progression using science packs
- Unlocks new recipes, buildings, and capabilities
- Prerequisite validation

### 6. Time Controller
- Handles game time progression
- Offline progress calculation
- Delta time updates for all systems

## Development Guidelines

### Data Integration
- All game content must reference `data.json` - never hardcode items, recipes, or technologies
- Use type-safe data access methods with TypeScript interfaces
- Implement data validation for loaded content
- Support internationalization through `i18n/*.json` files

### Icon System
- Icons are arranged in a 66px grid sprite sheet (`icons.webp`)
- Use CSS positioning for icon display
- Support `iconText` overlays for technology levels, temperatures, etc.
- Handle quality indicators from `hash.json` (quality levels 1-5)

### Production Logic
- Implement realistic production timing based on Factorio data
- Handle resource bottlenecks and production stalling
- Support machine upgrades and efficiency modules
- Calculate power requirements accurately

### Quality System
- Parse quality suffixes from `hash.json`: (1), (2), (3), (5) for quality levels
- Implement quality-based stat improvements
- Handle legendary quality items with 5x multipliers

### Performance Considerations
- Optimize for idle game requirements (runs when browser unfocused)
- Efficient delta time calculations for offline progress
- Batch production updates to minimize CPU usage
- Use localStorage for game state persistence

## Technical Implementation Notes

### TypeScript Interfaces
Key interfaces should match the `data.json` structure:
- `Item`, `Recipe`, `Technology`, `Machine` types
- Resource management interfaces
- Production facility specifications
- Power system components

### Testing Strategy  
- Unit tests for core game mechanics
- Integration tests for data loading
- Production chain validation tests
- Offline calculation accuracy tests

### Game Balance
- Reference Factorio timings and ratios
- Adapt for idle game pacing (faster progression)
- Balance manual vs automated efficiency
- Scale appropriately for idle gameplay loops

This project represents a complex simulation game requiring careful attention to data consistency, performance optimization, and faithful adaptation of Factorio's intricate production systems into an idle game format.