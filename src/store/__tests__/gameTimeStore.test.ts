import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import useGameTimeStore from '../gameTimeStore'

describe('gameTimeStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGameTimeStore.setState({ gameTime: 0 })
  })

  describe('initial state', () => {
    it('should have gameTime set to 0', () => {
      const state = useGameTimeStore.getState()
      expect(state.gameTime).toBe(0)
    })
  })

  describe('setGameTime', () => {
    it('should set game time to specific value', () => {
      const { setGameTime } = useGameTimeStore.getState()
      
      act(() => {
        setGameTime(1000)
      })
      
      expect(useGameTimeStore.getState().gameTime).toBe(1000)
    })

    it('should overwrite existing game time', () => {
      const { setGameTime } = useGameTimeStore.getState()
      
      act(() => {
        setGameTime(500)
      })
      expect(useGameTimeStore.getState().gameTime).toBe(500)
      
      act(() => {
        setGameTime(1500)
      })
      expect(useGameTimeStore.getState().gameTime).toBe(1500)
    })

    it('should handle negative values', () => {
      const { setGameTime } = useGameTimeStore.getState()
      
      act(() => {
        setGameTime(-100)
      })
      
      expect(useGameTimeStore.getState().gameTime).toBe(-100)
    })

    it('should handle zero value', () => {
      const { setGameTime } = useGameTimeStore.getState()
      
      // First set to non-zero
      act(() => {
        setGameTime(1000)
      })
      
      // Then reset to zero
      act(() => {
        setGameTime(0)
      })
      
      expect(useGameTimeStore.getState().gameTime).toBe(0)
    })
  })

  describe('incrementGameTime', () => {
    it('should increment game time by delta', () => {
      const { incrementGameTime } = useGameTimeStore.getState()
      
      act(() => {
        incrementGameTime(100)
      })
      
      expect(useGameTimeStore.getState().gameTime).toBe(100)
    })

    it('should accumulate increments', () => {
      const { incrementGameTime } = useGameTimeStore.getState()
      
      act(() => {
        incrementGameTime(100)
      })
      expect(useGameTimeStore.getState().gameTime).toBe(100)
      
      act(() => {
        incrementGameTime(50)
      })
      expect(useGameTimeStore.getState().gameTime).toBe(150)
      
      act(() => {
        incrementGameTime(25)
      })
      expect(useGameTimeStore.getState().gameTime).toBe(175)
    })

    it('should handle decimal increments', () => {
      const { incrementGameTime } = useGameTimeStore.getState()
      
      act(() => {
        incrementGameTime(0.1)
      })
      expect(useGameTimeStore.getState().gameTime).toBeCloseTo(0.1)
      
      act(() => {
        incrementGameTime(0.2)
      })
      expect(useGameTimeStore.getState().gameTime).toBeCloseTo(0.3)
    })

    it('should handle negative increments', () => {
      const { setGameTime, incrementGameTime } = useGameTimeStore.getState()
      
      // Start with positive time
      act(() => {
        setGameTime(1000)
      })
      
      // Decrement
      act(() => {
        incrementGameTime(-100)
      })
      
      expect(useGameTimeStore.getState().gameTime).toBe(900)
    })

    it('should handle large increments', () => {
      const { incrementGameTime } = useGameTimeStore.getState()
      
      act(() => {
        incrementGameTime(1000000)
      })
      
      expect(useGameTimeStore.getState().gameTime).toBe(1000000)
    })
  })

  describe('combined operations', () => {
    it('should work with setGameTime followed by incrementGameTime', () => {
      const { setGameTime, incrementGameTime } = useGameTimeStore.getState()
      
      act(() => {
        setGameTime(500)
      })
      
      act(() => {
        incrementGameTime(250)
      })
      
      expect(useGameTimeStore.getState().gameTime).toBe(750)
    })

    it('should handle multiple rapid increments', () => {
      const { incrementGameTime } = useGameTimeStore.getState()
      
      act(() => {
        for (let i = 0; i < 100; i++) {
          incrementGameTime(1)
        }
      })
      
      expect(useGameTimeStore.getState().gameTime).toBe(100)
    })
  })

  describe('store subscription', () => {
    it('should notify subscribers on state changes', () => {
      let notificationCount = 0
      let lastGameTime = 0
      
      const unsubscribe = useGameTimeStore.subscribe((state) => {
        notificationCount++
        lastGameTime = state.gameTime
      })
      
      const { setGameTime, incrementGameTime } = useGameTimeStore.getState()
      
      act(() => {
        setGameTime(100)
      })
      
      expect(notificationCount).toBe(1)
      expect(lastGameTime).toBe(100)
      
      act(() => {
        incrementGameTime(50)
      })
      
      expect(notificationCount).toBe(2)
      expect(lastGameTime).toBe(150)
      
      unsubscribe()
    })
  })

  describe('edge cases', () => {
    it('should handle very small increments', () => {
      const { incrementGameTime } = useGameTimeStore.getState()
      
      act(() => {
        incrementGameTime(0.00001)
      })
      
      expect(useGameTimeStore.getState().gameTime).toBeGreaterThan(0)
    })

    it('should handle floating point precision', () => {
      const { incrementGameTime } = useGameTimeStore.getState()
      
      // Known floating point precision issue: 0.1 + 0.2 !== 0.3
      act(() => {
        incrementGameTime(0.1)
        incrementGameTime(0.2)
      })
      
      expect(useGameTimeStore.getState().gameTime).toBeCloseTo(0.3, 10)
    })

    it('should not persist state (no localStorage)', () => {
      const { setGameTime } = useGameTimeStore.getState()
      
      act(() => {
        setGameTime(12345)
      })
      
      // Check that nothing is saved to localStorage
      expect(localStorage.getItem('game-storage')).toBeNull()
    })
  })
})