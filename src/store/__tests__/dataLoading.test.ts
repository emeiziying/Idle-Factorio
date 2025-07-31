import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DataService
const mockDataService = {
  isDataLoaded: vi.fn(),
  getInstance: vi.fn(),
};

vi.mock('@/services', () => ({
  DataService: class {
    static getInstance() {
      return mockDataService;
    }
  },
  RecipeService: class {
    static getRecipesThatProduce() {
      return [];
    }
    static getRecipeById() {
      return null;
    }
  },
  TechnologyService: class {
    static getInstance() {
      return {
        getTechnology: vi.fn(),
        isTechUnlocked: vi.fn(),
      };
    }
  },
  FuelService: class {
    static getInstance() {
      return {
        getFuelStatus: vi.fn(),
      };
    }
  },
}));

describe('GameStore Data Loading Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataService.getInstance.mockReturnValue(mockDataService);
  });

  it('should initialize with dataLoaded as false', async () => {
    const { default: useGameStore } = await import('../gameStore');
    
    const state = useGameStore.getState();
    expect(state.dataLoaded).toBe(false);
  });

  it('should set dataLoaded to true', async () => {
    const { default: useGameStore } = await import('../gameStore');
    
    const { setDataLoaded } = useGameStore.getState();
    setDataLoaded(true);
    
    const state = useGameStore.getState();
    expect(state.dataLoaded).toBe(true);
  });

  it('should set dataLoaded to true when data is already loaded during initialization', async () => {
    const { default: useGameStore } = await import('../gameStore');
    
    mockDataService.isDataLoaded.mockReturnValue(true);
    
    const { initializeDataLoading } = useGameStore.getState();
    initializeDataLoading();
    
    const state = useGameStore.getState();
    expect(state.dataLoaded).toBe(true);
  });

  it('should not change dataLoaded when data is not loaded during initialization', async () => {
    const { default: useGameStore } = await import('../gameStore');
    
    // Reset the store state first
    const { setDataLoaded } = useGameStore.getState();
    setDataLoaded(false);
    
    mockDataService.isDataLoaded.mockReturnValue(false);
    
    const { initializeDataLoading } = useGameStore.getState();
    initializeDataLoading();
    
    const state = useGameStore.getState();
    expect(state.dataLoaded).toBe(false);
  });

  it('should call DataService.isDataLoaded during initialization', async () => {
    const { default: useGameStore } = await import('../gameStore');
    
    mockDataService.isDataLoaded.mockReturnValue(false);
    
    const { initializeDataLoading } = useGameStore.getState();
    initializeDataLoading();
    
    expect(mockDataService.isDataLoaded).toHaveBeenCalled();
  });
});