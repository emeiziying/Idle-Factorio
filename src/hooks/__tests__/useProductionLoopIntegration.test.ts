import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';

// Mock GameLoopManager before any other imports
const mockGameLoopManager = {
  register: vi.fn(),
  unregister: vi.fn(),
  getInstance: vi.fn(),
};

vi.mock('@/utils/GameLoopManager', () => ({
  default: class {
    static getInstance() {
      return mockGameLoopManager;
    }
  },
}));

// Mock store
vi.mock('@/store/gameStore', () => ({
  default: vi.fn(() => ({
    facilities: [],
    updateFacility: vi.fn(),
    batchUpdateInventory: vi.fn(),
    getInventoryItem: vi.fn(() => ({ currentAmount: 100, maxCapacity: 1000 })),
    updateFuelConsumption: vi.fn(),
    autoRefuelFacilities: vi.fn(),
    trackCraftedItem: vi.fn(),
    trackMinedEntity: vi.fn(),
  })),
}));

// Mock services
vi.mock('@/services', () => ({
  FuelService: class {
    static getInstance() {
      return {
        getFuelStatus: vi.fn(() => ({ isEmpty: false })),
      };
    }
  },
  RecipeService: class {
    static getRecipeById() {
      return null;
    }
  },
  PowerService: class {
    static getInstance() {
      return {
        calculatePowerBalance: vi.fn(() => ({ surplus: 100, deficit: 0 })),
        updateFacilityPowerStatus: vi.fn((facility) => facility),
      };
    }
  },
}));

describe('useProductionLoop GameLoopManager Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameLoopManager.getInstance.mockReturnValue(mockGameLoopManager);
    cleanup();
  });

  it('should register with GameLoopManager when enabled', async () => {
    // Dynamic import to ensure mocks are in place
    const { useProductionLoop } = await import('../useProductionLoop');
    
    renderHook(() => useProductionLoop({ enabled: true, updateInterval: 1000 }));

    expect(mockGameLoopManager.register).toHaveBeenCalledWith(
      expect.stringMatching(/^production-loop-/),
      expect.any(Function),
      1000
    );
  });

  it('should unregister when disabled', async () => {
    const { useProductionLoop } = await import('../useProductionLoop');
    
    renderHook(() => useProductionLoop({ enabled: false }));

    expect(mockGameLoopManager.unregister).toHaveBeenCalled();
  });

  it('should unregister on unmount', async () => {
    const { useProductionLoop } = await import('../useProductionLoop');
    
    const { unmount } = renderHook(() => useProductionLoop({ enabled: true }));

    unmount();

    expect(mockGameLoopManager.unregister).toHaveBeenCalled();
  });

  it('should use default interval when not specified', async () => {
    const { useProductionLoop } = await import('../useProductionLoop');
    
    renderHook(() => useProductionLoop({ enabled: true }));

    expect(mockGameLoopManager.register).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      1000 // Default interval
    );
  });

  it('should return correct values', async () => {
    const { useProductionLoop } = await import('../useProductionLoop');
    
    const { result } = renderHook(() => useProductionLoop({ enabled: true }));

    expect(result.current).toEqual({
      updateProduction: expect.any(Function),
      isRunning: true,
    });
  });

  it('should return isRunning false when disabled', async () => {
    const { useProductionLoop } = await import('../useProductionLoop');
    
    const { result } = renderHook(() => useProductionLoop({ enabled: false }));

    expect(result.current.isRunning).toBe(false);
  });
});