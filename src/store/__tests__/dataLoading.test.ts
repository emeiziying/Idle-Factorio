import { describe, it, expect, beforeEach, vi } from 'vitest';

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
    mockGameLoopManager.getInstance.mockReturnValue(mockGameLoopManager);
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

  it('should initialize data loading check', async () => {
    const { default: useGameStore } = await import('../gameStore');
    
    mockDataService.isDataLoaded.mockReturnValue(false);
    
    const { initializeDataLoading } = useGameStore.getState();
    initializeDataLoading();
    
    expect(mockGameLoopManager.register).toHaveBeenCalledWith(
      'global-data-check',
      expect.any(Function),
      100
    );
  });

  it('should not register loop if data is already loaded', async () => {
    const { default: useGameStore } = await import('../gameStore');
    
    mockDataService.isDataLoaded.mockReturnValue(true);
    
    const { initializeDataLoading } = useGameStore.getState();
    initializeDataLoading();
    
    expect(mockGameLoopManager.register).not.toHaveBeenCalled();
    
    const state = useGameStore.getState();
    expect(state.dataLoaded).toBe(true);
  });

  it('should unregister loop when data becomes loaded', async () => {
    const { default: useGameStore } = await import('../gameStore');
    
    // First call returns false, second call returns true
    mockDataService.isDataLoaded
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    
    const { initializeDataLoading } = useGameStore.getState();
    initializeDataLoading();
    
    // Get the registered callback
    expect(mockGameLoopManager.register).toHaveBeenCalledWith(
      'global-data-check',
      expect.any(Function),
      100
    );
    
    const checkDataCallback = mockGameLoopManager.register.mock.calls[0][1];
    
    // Simulate the callback being called
    const result = checkDataCallback();
    
    expect(result).toBe(true);
    expect(mockGameLoopManager.unregister).toHaveBeenCalledWith('global-data-check');
    
    const state = useGameStore.getState();
    expect(state.dataLoaded).toBe(true);
  });
});