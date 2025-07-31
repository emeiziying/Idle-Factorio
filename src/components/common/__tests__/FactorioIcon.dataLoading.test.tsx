import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock store before other imports
const mockGameStore = {
  dataLoaded: false,
};

interface MockGameState {
  dataLoaded: boolean;
}

vi.mock('@/store/gameStore', () => ({
  default: (selector: (state: MockGameState) => unknown) => selector(mockGameStore),
}));

// Mock DataService
const mockDataService = {
  getIconInfo: vi.fn(() => ({ iconId: 'test-item', iconText: undefined })),
  getIconData: vi.fn(() => ({ position: '-66px -132px' })),
  getItem: vi.fn(() => ({ name: 'Test Item' })),
  getInstance: vi.fn(),
};

vi.mock('@/services', () => ({
  DataService: class {
    static getInstance() {
      return mockDataService;
    }
  },
}));

describe('FactorioIcon Data Loading Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataService.getInstance.mockReturnValue(mockDataService);
    mockGameStore.dataLoaded = false;
  });

  it('should not load icon data when dataLoaded is false', async () => {
    const { default: FactorioIcon } = await import('../FactorioIcon');
    
    render(<FactorioIcon itemId="test-item" size={32} />);
    
    // Should not call getIconInfo or getIconData when dataLoaded is false
    expect(mockDataService.getIconInfo).not.toHaveBeenCalled();
    expect(mockDataService.getIconData).not.toHaveBeenCalled();
  });

  it('should load icon data when dataLoaded is true', async () => {
    mockGameStore.dataLoaded = true;
    
    const { default: FactorioIcon } = await import('../FactorioIcon');
    
    render(<FactorioIcon itemId="test-item" size={32} />);
    
    // Should call getIconInfo and getIconData when dataLoaded is true
    expect(mockDataService.getIconInfo).toHaveBeenCalledWith('test-item');
    expect(mockDataService.getIconData).toHaveBeenCalledWith('test-item');
  });

  it('should handle custom image without checking dataLoaded', async () => {
    const { default: FactorioIcon } = await import('../FactorioIcon');
    
    render(<FactorioIcon customImage="/test-image.png" size={32} />);
    
    // Should not call any data service methods when using custom image
    expect(mockDataService.getIconInfo).not.toHaveBeenCalled();
    expect(mockDataService.getIconData).not.toHaveBeenCalled();
  });
});