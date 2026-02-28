# Idle Factorio Project Analysis

## Project Overview

This is a Factorio-inspired idle management game built with a modern web stack. The goal is to manage resources, automate production, and expand a factory. The application is architected with a clear separation of concerns, featuring a dependency-injection-based service layer for business logic and a centralized state management solution.

**Key Technologies:**
- **Framework:** React 19 & TypeScript
- **Build Tool:** Vite
- **UI:** Material-UI (MUI) v7
- **State Management:** Zustand v5
- **Package Manager:** pnpm

## Building and Running

Standard commands are defined in `package.json`.

- **Install Dependencies:**
  ```bash
  pnpm install
  ```
- **Run Development Server:**
  ```bash
  pnpm dev
  ```
- **Run Tests:**
  ```bash
  pnpm test
  ```
- **Lint Code:**
  ```bash
  pnpm lint
  ```
- **Build for Production:**
  ```bash
  pnpm build
  ```

## Development Conventions

### **1. Import Alias (Crucial!)**

The project is configured with a path alias `@` pointing to the `src` directory. **All internal imports MUST use this alias** to maintain consistency and avoid relative path hell (`../`).

**Correct:**
```typescript
import { useGameStore } from '@/store/gameStore';
import { ProductionService } from '@/services/production/ProductionService';
import { AppButton } from '@/components/common/AppButton';
```

**Incorrect:**
```typescript
import { useGameStore } from './store/gameStore';
import { ProductionService } from '../services/production/ProductionService';
```

### **2. Architecture**

The application follows a modern, decoupled architecture.

#### **Service Layer (Dependency Injection)**
- The project has moved from a Service Locator pattern to a more robust **Dependency Injection (DI)** architecture.
- A central `DIContainer` manages service instances.
- Services are registered with unique `ServiceTokens` (e.g., `SERVICE_TOKENS.DATA_SERVICE`).
- **Accessing Services:** Services should be accessed within React components via dedicated hooks (e.g., `useDataService()`) which are defined in `src/hooks/useDIServices.ts`. This ensures components remain decoupled and easy to test.

#### **State Management (Zustand)**
- **Central Store:** A single `useGameStore` is the source of truth.
- **Slices:** The store is organized into "slices" for different domains (e.g., `inventoryStore`, `craftingStore`, `technologyStore`). This keeps the main store file clean and modular.
- **Persistence:** Game state is automatically persisted to `localStorage` using `zustand/middleware/persist` and compressed with `lz-string` to save space.

### **3. Core Gameplay Logic**

- **Game Loop:** The core game loop is managed by the `useGameLoop` hook. It uses `requestAnimationFrame` for efficient, non-blocking updates to game time and production.
- **Production:** Production calculations are handled within the service layer, with hooks like `useProductionLoop` orchestrating the process.

### **4. Code Style & Quality**

- **Linting:** ESLint is configured to enforce code quality. Run `pnpm lint` to check for issues.
- **Formatting:** Prettier is used for automatic code formatting.
- **TypeScript:** The project uses TypeScript in strict mode. Avoid using `any` and provide explicit types where possible.
