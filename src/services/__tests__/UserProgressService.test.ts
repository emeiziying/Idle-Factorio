/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UserProgressService } from '../UserProgressService'

// Mock logger
vi.mock('../../utils/logger', () => ({
  warn: vi.fn()
}))

describe('UserProgressService', () => {
  let service: UserProgressService
  const STORAGE_KEY = 'factorio_user_progress'

  beforeEach(() => {
    // Clear instance
    (UserProgressService as any).instance = null
    
    // Clear localStorage
    localStorage.clear()
    
    // Get fresh instance
    service = UserProgressService.getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = UserProgressService.getInstance()
      const instance2 = UserProgressService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('item unlocking', () => {
    describe('isItemUnlocked', () => {
      it('should return false for locked items', () => {
        expect(service.isItemUnlocked('iron-plate')).toBe(false)
      })

      it('should return true for unlocked items', () => {
        service.unlockItem('iron-plate')
        expect(service.isItemUnlocked('iron-plate')).toBe(true)
      })
    })

    describe('unlockItem', () => {
      it('should unlock single item', () => {
        service.unlockItem('copper-plate')
        
        expect(service.isItemUnlocked('copper-plate')).toBe(true)
        expect(service.getUnlockedItems()).toContain('copper-plate')
      })

      it('should save progress after unlocking', () => {
        const saveSpy = vi.spyOn(service as any, 'saveProgress')
        
        service.unlockItem('steel-plate')
        
        expect(saveSpy).toHaveBeenCalled()
      })

      it('should handle duplicate unlocks', () => {
        service.unlockItem('iron-gear-wheel')
        service.unlockItem('iron-gear-wheel')
        
        const unlockedItems = service.getUnlockedItems()
        expect(unlockedItems.filter(id => id === 'iron-gear-wheel')).toHaveLength(1)
      })
    })

    describe('unlockItems', () => {
      it('should unlock multiple items', () => {
        const items = ['iron-plate', 'copper-plate', 'steel-plate']
        
        service.unlockItems(items)
        
        items.forEach(item => {
          expect(service.isItemUnlocked(item)).toBe(true)
        })
      })

      it('should save progress once after batch unlock', () => {
        const saveSpy = vi.spyOn(service as any, 'saveProgress')
        
        service.unlockItems(['item1', 'item2', 'item3'])
        
        expect(saveSpy).toHaveBeenCalledTimes(1)
      })
    })

    describe('getUnlockedItems', () => {
      it('should return empty array when no items unlocked', () => {
        expect(service.getUnlockedItems()).toEqual([])
      })

      it('should return all unlocked items', () => {
        service.unlockItems(['item1', 'item2', 'item3'])
        
        const unlocked = service.getUnlockedItems()
        expect(unlocked).toHaveLength(3)
        expect(unlocked).toContain('item1')
        expect(unlocked).toContain('item2')
        expect(unlocked).toContain('item3')
      })
    })
  })

  describe('technology unlocking', () => {
    describe('isTechUnlocked', () => {
      it('should return false for locked techs', () => {
        expect(service.isTechUnlocked('automation')).toBe(false)
      })

      it('should return true for unlocked techs', () => {
        service.unlockTech('automation')
        expect(service.isTechUnlocked('automation')).toBe(true)
      })
    })

    describe('unlockTech', () => {
      it('should unlock single tech', () => {
        service.unlockTech('logistics')
        
        expect(service.isTechUnlocked('logistics')).toBe(true)
        expect(service.getUnlockedTechs()).toContain('logistics')
      })

      it('should save progress after unlocking', () => {
        const saveSpy = vi.spyOn(service as any, 'saveProgress')
        
        service.unlockTech('steel-processing')
        
        expect(saveSpy).toHaveBeenCalled()
      })
    })

    describe('unlockTechs', () => {
      it('should unlock multiple techs', () => {
        const techs = ['automation', 'logistics', 'steel-processing']
        
        service.unlockTechs(techs)
        
        techs.forEach(tech => {
          expect(service.isTechUnlocked(tech)).toBe(true)
        })
      })
    })

    describe('getUnlockedTechs', () => {
      it('should return empty array when no techs unlocked', () => {
        expect(service.getUnlockedTechs()).toEqual([])
      })

      it('should return all unlocked techs', () => {
        service.unlockTechs(['tech1', 'tech2', 'tech3'])
        
        const unlocked = service.getUnlockedTechs()
        expect(unlocked).toHaveLength(3)
        expect(unlocked).toContain('tech1')
        expect(unlocked).toContain('tech2')
        expect(unlocked).toContain('tech3')
      })
    })
  })

  describe('progress persistence', () => {
    it('should save progress to localStorage', () => {
      service.unlockItems(['iron-plate', 'copper-plate'])
      service.unlockTechs(['automation', 'logistics'])
      
      const saved = localStorage.getItem(STORAGE_KEY)
      expect(saved).toBeTruthy()
      
      const data = JSON.parse(saved!)
      expect(data.unlockedItems).toContain('iron-plate')
      expect(data.unlockedItems).toContain('copper-plate')
      expect(data.unlockedTechs).toContain('automation')
      expect(data.unlockedTechs).toContain('logistics')
      expect(data.lastUpdated).toBeDefined()
    })

    it('should load progress from localStorage on initialization', () => {
      // Set up saved data
      const savedData = {
        unlockedItems: ['saved-item-1', 'saved-item-2'],
        unlockedTechs: ['saved-tech-1', 'saved-tech-2'],
        lastUpdated: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData))
      
      // Create new instance
      // @ts-ignore - clearing singleton instance
      ;(UserProgressService as any).instance = null
      const newService = UserProgressService.getInstance()
      
      // Check loaded data
      expect(newService.isItemUnlocked('saved-item-1')).toBe(true)
      expect(newService.isItemUnlocked('saved-item-2')).toBe(true)
      expect(newService.isTechUnlocked('saved-tech-1')).toBe(true)
      expect(newService.isTechUnlocked('saved-tech-2')).toBe(true)
    })

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json')
      
      // Should not throw when creating instance
      // @ts-ignore - clearing singleton instance
      ;(UserProgressService as any).instance = null
      expect(() => UserProgressService.getInstance()).not.toThrow()
      
      const newService = UserProgressService.getInstance()
      expect(newService.getUnlockedItems()).toEqual([])
      expect(newService.getUnlockedTechs()).toEqual([])
    })

    it('should handle localStorage errors when saving', () => {
      // Mock localStorage.setItem to throw
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      
      // Should not throw when saving
      expect(() => service.unlockItem('test-item')).not.toThrow()
      
      setItemSpy.mockRestore()
    })
  })

  describe('resetProgress', () => {
    it('should clear all unlocked items and techs', () => {
      service.unlockItems(['item1', 'item2', 'item3'])
      service.unlockTechs(['tech1', 'tech2', 'tech3'])
      
      service.resetProgress()
      
      expect(service.getUnlockedItems()).toEqual([])
      expect(service.getUnlockedTechs()).toEqual([])
    })

    it('should save cleared state to localStorage', () => {
      service.unlockItems(['item1', 'item2'])
      service.unlockTechs(['tech1', 'tech2'])
      
      service.resetProgress()
      
      const saved = localStorage.getItem(STORAGE_KEY)
      const data = JSON.parse(saved!)
      
      expect(data.unlockedItems).toEqual([])
      expect(data.unlockedTechs).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle empty arrays in batch operations', () => {
      expect(() => service.unlockItems([])).not.toThrow()
      expect(() => service.unlockTechs([])).not.toThrow()
    })

    it('should maintain separate namespaces for items and techs', () => {
      service.unlockItem('automation')
      service.unlockTech('automation')
      
      expect(service.isItemUnlocked('automation')).toBe(true)
      expect(service.isTechUnlocked('automation')).toBe(true)
      
      // They should be tracked separately
      expect(service.getUnlockedItems()).toContain('automation')
      expect(service.getUnlockedTechs()).toContain('automation')
    })

    it('should handle very large datasets', () => {
      const largeItemSet = Array.from({ length: 1000 }, (_, i) => `item-${i}`)
      const largeTechSet = Array.from({ length: 1000 }, (_, i) => `tech-${i}`)
      
      service.unlockItems(largeItemSet)
      service.unlockTechs(largeTechSet)
      
      expect(service.getUnlockedItems()).toHaveLength(1000)
      expect(service.getUnlockedTechs()).toHaveLength(1000)
      
      // Should still be able to save and load
      const saved = localStorage.getItem(STORAGE_KEY)
      expect(saved).toBeTruthy()
      expect(JSON.parse(saved!).unlockedItems).toHaveLength(1000)
    })
  })
})