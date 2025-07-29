import { describe, it, expect } from 'vitest'
import {
  getClickableStyles,
  getDisabledStyles,
  getLoadingStyles,
  getSelectedStyles,
  getResponsiveGridStyles,
  getTruncateStyles,
  getGradientStyles,
  getCardStyles,
  getCenterStyles,
  mergeStyles
} from '../styleHelpers'

describe('styleHelpers', () => {
  describe('getClickableStyles', () => {
    it('should return clickable styles when isClickable is true', () => {
      const styles = getClickableStyles(true) as any
      
      expect(styles.cursor).toBe('pointer')
      expect(styles.transition).toBe('opacity 0.2s')
      expect(styles['&:hover']).toEqual({ opacity: 0.8 })
      expect(styles['&:active']).toEqual({ opacity: 0.7 })
    })

    it('should return non-clickable styles when isClickable is false', () => {
      const styles = getClickableStyles(false) as any
      
      expect(styles.cursor).toBe('default')
      expect(styles['&:hover']).toEqual({})
      expect(styles['&:active']).toEqual({})
    })

    it('should use custom hover opacity', () => {
      const styles = getClickableStyles(true, 0.6) as any
      
      expect(styles['&:hover']).toEqual({ opacity: 0.6 })
      expect(styles['&:active']).toEqual({ opacity: 0.5 })
    })
  })

  describe('getDisabledStyles', () => {
    it('should return disabled styles when isDisabled is true', () => {
      const styles = getDisabledStyles(true) as any
      
      expect(styles.opacity).toBe(0.5)
      expect(styles.pointerEvents).toBe('none')
      expect(styles.filter).toBe('grayscale(50%)')
    })

    it('should return enabled styles when isDisabled is false', () => {
      const styles = getDisabledStyles(false) as any
      
      expect(styles.opacity).toBe(1)
      expect(styles.pointerEvents).toBe('auto')
      expect(styles.filter).toBe('none')
    })
  })

  describe('getLoadingStyles', () => {
    it('should return loading overlay when isLoading is true', () => {
      const styles = getLoadingStyles(true) as any
      
      expect(styles.position).toBe('relative')
      expect(styles['&::after']).toMatchObject({
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      })
    })

    it('should not show overlay when isLoading is false', () => {
      const styles = getLoadingStyles(false) as any
      
      expect(styles.position).toBe('relative')
      expect(styles['&::after']).toEqual({})
    })
  })

  describe('getSelectedStyles', () => {
    it('should return selected styles when isSelected is true', () => {
      const styles = getSelectedStyles(true) as any
      
      expect(styles.borderColor).toBe('primary.main')
      expect(styles.borderWidth).toBe(2)
      expect(styles.borderStyle).toBe('solid')
      expect(styles.backgroundColor).toBe('action.selected')
    })

    it('should return unselected styles when isSelected is false', () => {
      const styles = getSelectedStyles(false) as any
      
      expect(styles.borderColor).toBe('transparent')
      expect(styles.backgroundColor).toBe('transparent')
    })

    it('should use custom selected color', () => {
      const styles = getSelectedStyles(true, 'secondary.main') as any
      
      expect(styles.borderColor).toBe('secondary.main')
    })
  })

  describe('getResponsiveGridStyles', () => {
    it('should return responsive grid with default values', () => {
      const styles = getResponsiveGridStyles() as any
      
      expect(styles.display).toBe('grid')
      expect(styles.gridTemplateColumns).toEqual({
        xs: 'repeat(2, 1fr)',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(4, 1fr)'
      })
      expect(styles.gap).toBe(2)
    })

    it('should use custom items per row', () => {
      const styles = getResponsiveGridStyles(6, 3) as any
      
      expect(styles.gridTemplateColumns).toEqual({
        xs: 'repeat(3, 1fr)',
        sm: 'repeat(3, 1fr)',
        md: 'repeat(6, 1fr)'
      })
    })
  })

  describe('getTruncateStyles', () => {
    it('should return single line truncate styles by default', () => {
      const styles = getTruncateStyles() as any
      
      expect(styles.overflow).toBe('hidden')
      expect(styles.textOverflow).toBe('ellipsis')
      expect(styles.display).toBe('-webkit-box')
      expect(styles.WebkitLineClamp).toBe(1)
      expect(styles.WebkitBoxOrient).toBe('vertical')
      expect(styles.wordBreak).toBe('break-word')
    })

    it('should support multi-line truncation', () => {
      const styles = getTruncateStyles(3) as any
      
      expect(styles.WebkitLineClamp).toBe(3)
    })
  })

  describe('getGradientStyles', () => {
    it('should return gradient with default angle', () => {
      const styles = getGradientStyles('#000', '#fff') as any
      
      expect(styles.background).toBe('linear-gradient(135deg, #000, #fff)')
    })

    it('should use custom angle', () => {
      const styles = getGradientStyles('#ff0000', '#00ff00', 90) as any
      
      expect(styles.background).toBe('linear-gradient(90deg, #ff0000, #00ff00)')
    })
  })

  describe('getCardStyles', () => {
    it('should return basic card styles', () => {
      const styles = getCardStyles() as any
      
      expect(styles.boxShadow).toBe(1)
      expect(styles.borderRadius).toBe(1)
      expect(styles.transition).toBe('all 0.3s ease')
      expect(styles['&:hover']).toBeUndefined()
    })

    it('should add hover effects when isHoverable is true', () => {
      const styles = getCardStyles(true, 2) as any
      
      expect(styles.boxShadow).toBe(2)
      expect(styles['&:hover']).toEqual({
        boxShadow: 4,
        transform: 'translateY(-2px)'
      })
    })
  })

  describe('getCenterStyles', () => {
    it('should center both horizontally and vertically by default', () => {
      const styles = getCenterStyles() as any
      
      expect(styles.display).toBe('flex')
      expect(styles.justifyContent).toBe('center')
      expect(styles.alignItems).toBe('center')
    })

    it('should center only horizontally', () => {
      const styles = getCenterStyles(true, false) as any
      
      expect(styles.display).toBe('flex')
      expect(styles.justifyContent).toBe('center')
      expect(styles.alignItems).toBeUndefined()
    })

    it('should center only vertically', () => {
      const styles = getCenterStyles(false, true) as any
      
      expect(styles.display).toBe('flex')
      expect(styles.justifyContent).toBeUndefined()
      expect(styles.alignItems).toBe('center')
    })
  })

  describe('mergeStyles', () => {
    it('should merge multiple style objects', () => {
      const style1 = { color: 'red', fontSize: 14 }
      const style2 = { backgroundColor: 'blue', fontSize: 16 }
      const style3 = { padding: 2 }
      
      const merged = mergeStyles(style1, style2, style3) as any
      
      expect(merged).toEqual({
        color: 'red',
        fontSize: 16,
        backgroundColor: 'blue',
        padding: 2
      })
    })

    it('should filter out undefined styles', () => {
      const style1 = { color: 'red' }
      const merged = mergeStyles(style1, undefined, null as any) as any
      
      expect(merged).toEqual({ color: 'red' })
    })

    it('should return empty object when no styles provided', () => {
      const merged = mergeStyles() as any
      
      expect(merged).toEqual({})
    })

    it('should handle nested objects', () => {
      const style1 = { 
        color: 'red',
        '&:hover': { color: 'blue' }
      }
      const style2 = { 
        fontSize: 16,
        '&:hover': { backgroundColor: 'gray' }
      }
      
      const merged = mergeStyles(style1, style2) as any
      
      expect(merged).toEqual({
        color: 'red',
        fontSize: 16,
        '&:hover': { backgroundColor: 'gray' }
      })
    })
  })
})