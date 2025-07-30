import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StorageService } from '../StorageService'
import { ServiceLocator } from '../ServiceLocator'
import type { DataService } from '../DataService'
import type { Item, Recipe } from '../../types'

// Mock STORAGE_SPECIFIC_CONFIGS
vi.mock('../../data/storageConfigData', () => ({
  STORAGE_SPECIFIC_CONFIGS: {
    'wooden-chest': {
      category: 'solid',
      additionalStacks: 10,
      description: 'Basic wooden storage',
      dimensions: { width: 4, height: 4 },
      requiredTechnology: 'wood-processing'
    },
    'iron-chest': {
      category: 'solid',
      additionalStacks: 20,
      description: 'Improved iron storage',
      dimensions: { width: 6, height: 4 },
      requiredTechnology: 'metal-processing'
    },
    'storage-tank': {
      category: 'liquid',
      fluidCapacity: 25000,
      description: 'Basic liquid storage',
      dimensions: { width: 3, height: 3 },
      requiredTechnology: 'fluid-handling'
    },
    'fluid-tank': {
      category: 'liquid',
      fluidCapacity: 50000,
      description: 'Advanced liquid storage',
      dimensions: { width: 4, height: 4 },
      requiredTechnology: 'advanced-fluid-handling'
    }
  }
}))

describe('StorageService', () => {
  let storageService: StorageService
  let mockDataService: { 
    getItem: ReturnType<typeof vi.fn>
    getRecipe: ReturnType<typeof vi.fn>
    getLocalizedItemName: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    // Clear any existing instance
    ;(StorageService as unknown as { instance: StorageService | null }).instance = null
    
    // Create mock DataService
    mockDataService = {
      getItem: vi.fn(),
      getRecipe: vi.fn(),
      getLocalizedItemName: vi.fn()
    }

    // Setup ServiceLocator mock
    vi.spyOn(ServiceLocator, 'has').mockReturnValue(true)
    vi.spyOn(ServiceLocator, 'get').mockReturnValue(mockDataService as unknown as DataService)

    storageService = StorageService.getInstance()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = StorageService.getInstance()
      const instance2 = StorageService.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('getStorageConfig', () => {
    it('should return complete storage config for valid storage type', () => {
      const mockItem = { id: 'wooden-chest', name: 'Wooden Chest' }
      const mockRecipe = {
        id: 'wooden-chest',
        name: 'Wooden Chest',
        category: 'crafting',
        time: 0.5,
        in: { 'wood': 4 },
        out: { 'wooden-chest': 1 }
      }

      vi.mocked(mockDataService.getItem).mockReturnValue(mockItem as Item)
      vi.mocked(mockDataService.getRecipe).mockReturnValue(mockRecipe as Recipe)
      vi.mocked(mockDataService.getLocalizedItemName).mockReturnValue('木制箱子')

      const config = storageService.getStorageConfig('wooden-chest')

      expect(config).toEqual({
        itemId: 'wooden-chest',
        name: '木制箱子',
        category: 'solid',
        additionalStacks: 10,
        fluidCapacity: undefined,
        recipe: { 'wood': 4 },
        craftingTime: 0.5,
        description: 'Basic wooden storage',
        dimensions: { width: 4, height: 4 },
        requiredTechnology: 'wood-processing'
      })
    })

    it('should return undefined for unknown storage type', () => {
      const config = storageService.getStorageConfig('unknown-storage')
      expect(config).toBeUndefined()
    })

    it('should return undefined when DataService is not available', () => {
      vi.mocked(ServiceLocator.has).mockReturnValue(false)
      
      const config = storageService.getStorageConfig('wooden-chest')
      expect(config).toBeUndefined()
    })

    it('should return undefined when item or recipe not found', () => {
      vi.mocked(mockDataService.getItem).mockReturnValue(undefined)
      
      const config = storageService.getStorageConfig('wooden-chest')
      expect(config).toBeUndefined()
    })

    it('should handle liquid storage config', () => {
      const mockItem = { id: 'storage-tank', name: 'Storage Tank' }
      const mockRecipe = {
        id: 'storage-tank',
        name: 'Storage Tank',
        category: 'crafting',
        time: 3,
        in: { 'iron-plate': 20, 'steel-plate': 5 },
        out: { 'storage-tank': 1 }
      }

      vi.mocked(mockDataService.getItem).mockReturnValue(mockItem as Item)
      vi.mocked(mockDataService.getRecipe).mockReturnValue(mockRecipe as Recipe)
      vi.mocked(mockDataService.getLocalizedItemName).mockReturnValue('储液罐')

      const config = storageService.getStorageConfig('storage-tank')

      expect(config).toEqual({
        itemId: 'storage-tank',
        name: '储液罐',
        category: 'liquid',
        additionalStacks: undefined,
        fluidCapacity: 25000,
        recipe: { 'iron-plate': 20, 'steel-plate': 5 },
        craftingTime: 3,
        description: 'Basic liquid storage',
        dimensions: { width: 3, height: 3 },
        requiredTechnology: 'fluid-handling'
      })
    })
  })

  describe('getAvailableStorageTypes', () => {
    it('should return all storage types', () => {
      const types = storageService.getAvailableStorageTypes()
      
      expect(types).toEqual([
        'wooden-chest',
        'iron-chest',
        'storage-tank',
        'fluid-tank'
      ])
    })
  })

  describe('getSolidStorageTypes', () => {
    it('should return only solid storage types', () => {
      const types = storageService.getSolidStorageTypes()
      
      expect(types).toEqual(['wooden-chest', 'iron-chest'])
    })
  })

  describe('getLiquidStorageTypes', () => {
    it('should return only liquid storage types', () => {
      const types = storageService.getLiquidStorageTypes()
      
      expect(types).toEqual(['storage-tank', 'fluid-tank'])
    })
  })

  describe('isStorageDevice', () => {
    it('should return true for valid storage devices', () => {
      expect(storageService.isStorageDevice('wooden-chest')).toBe(true)
      expect(storageService.isStorageDevice('iron-chest')).toBe(true)
      expect(storageService.isStorageDevice('storage-tank')).toBe(true)
    })

    it('should return false for non-storage items', () => {
      expect(storageService.isStorageDevice('iron-plate')).toBe(false)
      expect(storageService.isStorageDevice('unknown-item')).toBe(false)
    })
  })

  describe('getStorageSpecificConfig', () => {
    it('should return specific config for storage type', () => {
      const config = storageService.getStorageSpecificConfig('wooden-chest')
      
      expect(config).toEqual({
        category: 'solid',
        additionalStacks: 10,
        description: 'Basic wooden storage',
        dimensions: { width: 4, height: 4 },
        requiredTechnology: 'wood-processing'
      })
    })

    it('should return undefined for unknown storage type', () => {
      const config = storageService.getStorageSpecificConfig('unknown')
      expect(config).toBeUndefined()
    })
  })

  describe('backward compatibility methods', () => {
    it('getChestConfig should call getStorageConfig', () => {
      const spy = vi.spyOn(storageService, 'getStorageConfig')
      
      storageService.getChestConfig('wooden-chest')
      
      expect(spy).toHaveBeenCalledWith('wooden-chest')
    })

    it('getAvailableChestTypes should call getSolidStorageTypes', () => {
      const spy = vi.spyOn(storageService, 'getSolidStorageTypes')
      
      const types = storageService.getAvailableChestTypes()
      
      expect(spy).toHaveBeenCalled()
      expect(types).toEqual(['wooden-chest', 'iron-chest'])
    })
  })
})