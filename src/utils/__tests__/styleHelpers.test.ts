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
      const styles = getClickableStyles(true)
      
      expect(styles).toHaveProperty('cursor', 'pointer')
      expect(styles).toHaveProperty('transition', 'opacity 0.2s')
      expect(styles).toHaveProperty('&:hover')
      expect(styles).toHaveProperty('&:active')
    })

    it('should return non-clickable styles when isClickable is false', () => {
      const styles = getClickableStyles(false)
      
      expect(styles).toEqual({
        cursor: 'default',
        transition: 'opacity 0.2s',
        '&:hover': {},
        '&:active': {}
      })
    })

    it('should use custom hover opacity', () => {
      const hoverOpacity = 0.6
      const styles = getClickableStyles(true, hoverOpacity)
      
      expect(styles['&:hover']).toEqual({ opacity: 0.6 })
    })

    it('should handle edge case hover opacity values', () => {
      const styles1 = getClickableStyles(true, 0)
      expect(styles1['&:active']).toHaveProperty('opacity')

      const styles2 = getClickableStyles(true, 1)
      expect(styles2['&:active']).toHaveProperty('opacity')
    })
  })

  describe('getDisabledStyles', () => {
    it('should return disabled styles when isDisabled is true', () => {
      const styles = getDisabledStyles(true)
      
      expect(styles).toEqual({
        opacity: 0.5,
        pointerEvents: 'none',
        filter: 'grayscale(50%)'
      })
    })

    it('should return enabled styles when isDisabled is false', () => {
      const styles = getDisabledStyles(false)
      
      expect(styles).toEqual({
        opacity: 1,
        pointerEvents: 'auto',
        filter: 'none'
      })
    })
  })

  describe('getLoadingStyles', () => {
    it('should return loading styles when isLoading is true', () => {
      const styles = getLoadingStyles(true)
      
      expect(styles).toEqual({
        position: 'relative',
        '&::after': {
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
        }
      })
    })

    it('should return minimal styles when isLoading is false', () => {
      const styles = getLoadingStyles(false)
      
      expect(styles).toEqual({
        position: 'relative',
        '&::after': {}
      })
    })
  })

  describe('getSelectedStyles', () => {
    it('should return selected styles with default color', () => {
      const styles = getSelectedStyles(true)
      
      expect(styles).toEqual({
        borderColor: 'primary.main',
        borderWidth: 2,
        borderStyle: 'solid',
        backgroundColor: 'action.selected'
      })
    })

    it('should return unselected styles', () => {
      const styles = getSelectedStyles(false)
      
      expect(styles).toEqual({
        borderColor: 'transparent',
        borderWidth: 2,
        borderStyle: 'solid',
        backgroundColor: 'transparent'
      })
    })

    it('should use custom selected color', () => {
      const customColor = '#ff0000'
      const styles = getSelectedStyles(true, customColor)
      
      expect(styles.borderColor).toBe(customColor)
    })
  })

  describe('getResponsiveGridStyles', () => {
    it('should return responsive grid styles with default values', () => {
      const styles = getResponsiveGridStyles()
      
      expect(styles).toEqual({
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        },
        gap: 2
      })
    })

    it('should use custom items per row', () => {
      const styles = getResponsiveGridStyles(6, 3)
      
      expect(styles).toEqual({
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(3, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(6, 1fr)'
        },
        gap: 2
      })
    })
  })

  describe('getTruncateStyles', () => {
    it('should return single line truncate styles by default', () => {
      const styles = getTruncateStyles()
      
      expect(styles).toEqual({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 1,
        WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word'
      })
    })

    it('should handle multiple lines', () => {
      const styles = getTruncateStyles(3)
      
      expect(styles.WebkitLineClamp).toBe(3)
    })
  })

  describe('getGradientStyles', () => {
    it('should create gradient with default angle', () => {
      const styles = getGradientStyles('#ff0000', '#00ff00')
      
      expect(styles).toEqual({
        background: 'linear-gradient(135deg, #ff0000, #00ff00)'
      })
    })

    it('should use custom angle', () => {
      const styles = getGradientStyles('#ff0000', '#00ff00', 90)
      
      expect(styles).toEqual({
        background: 'linear-gradient(90deg, #ff0000, #00ff00)'
      })
    })
  })

  describe('getCardStyles', () => {
    it('should return basic card styles', () => {
      const styles = getCardStyles()
      
      expect(styles).toEqual({
        boxShadow: 1,
        borderRadius: 1,
        transition: 'all 0.3s ease'
      })
    })

    it('should add hover effects when hoverable', () => {
      const styles = getCardStyles(true, 2)
      
      expect(styles).toHaveProperty('&:hover')
      expect(styles['&:hover']).toEqual({
        boxShadow: 4,
        transform: 'translateY(-2px)'
      })
    })

    it('should use custom elevation', () => {
      const styles = getCardStyles(false, 5)
      
      expect(styles.boxShadow).toBe(5)
    })
  })

  describe('getCenterStyles', () => {
    it('should center both horizontally and vertically by default', () => {
      const styles = getCenterStyles()
      
      expect(styles).toEqual({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      })
    })

    it('should center only horizontally', () => {
      const styles = getCenterStyles(true, false)
      
      expect(styles).toEqual({
        display: 'flex',
        justifyContent: 'center'
      })
    })

    it('should center only vertically', () => {
      const styles = getCenterStyles(false, true)
      
      expect(styles).toEqual({
        display: 'flex',
        alignItems: 'center'
      })
    })

    it('should not center when both are false', () => {
      const styles = getCenterStyles(false, false)
      
      expect(styles).toEqual({
        display: 'flex'
      })
    })
  })

  describe('mergeStyles', () => {
    it('should merge multiple style objects', () => {
      const style1 = { color: 'red', fontSize: 14 }
      const style2 = { backgroundColor: 'blue', fontSize: 16 }
      const style3 = { margin: 10 }
      
      const merged = mergeStyles(style1, style2, style3)
      
      expect(merged).toEqual({
        color: 'red',
        fontSize: 16, // Later values override earlier ones
        backgroundColor: 'blue',
        margin: 10
      })
    })

    it('should handle undefined and null values', () => {
      const style1 = { color: 'red' }
      const style2 = undefined
      const style3 = null
      const style4 = { fontSize: 14 }
      
      const merged = mergeStyles(style1, style2, style3, style4)
      
      expect(merged).toEqual({
        color: 'red',
        fontSize: 14
      })
    })

    it('should handle empty objects', () => {
      const merged = mergeStyles({}, { color: 'red' }, {})
      
      expect(merged).toEqual({ color: 'red' })
    })

    it('should handle no arguments', () => {
      const merged = mergeStyles()
      
      expect(merged).toEqual({})
    })
  })

  describe('integration tests', () => {
    it('should work well when combining multiple style functions', () => {
      const clickableStyles = getClickableStyles(true, 0.9)
      const disabledStyles = getDisabledStyles(false)
      const centerStyles = getCenterStyles()
      
      const combined = mergeStyles(clickableStyles, disabledStyles, centerStyles)
      
      expect(combined).toHaveProperty('cursor', 'pointer')
      expect(combined).toHaveProperty('opacity', 1)
      expect(combined).toHaveProperty('display', 'flex')
      expect(combined).toHaveProperty('justifyContent', 'center')
    })

    it('should handle complex card and gradient styles', () => {
      const cardStyles = getCardStyles(true, 3)
      const gradientStyles = getGradientStyles('#ff0000', '#0000ff', 45)
      
      const combined = mergeStyles(cardStyles, gradientStyles)
      
      expect(combined).toHaveProperty('boxShadow', 3)
      expect(combined).toHaveProperty('background')
      expect(combined).toHaveProperty('&:hover')
    })
  })

  describe('edge cases and validation', () => {
    it('should handle extreme values gracefully', () => {
      expect(() => getResponsiveGridStyles(0, 0)).not.toThrow()
      expect(() => getTruncateStyles(0)).not.toThrow()
      expect(() => getCardStyles(true, -1)).not.toThrow()
      expect(() => getGradientStyles('', '', -360)).not.toThrow()
    })

    it('should maintain style object structure', () => {
      const styles = getClickableStyles(true)
      
      expect(typeof styles).toBe('object')
      expect(styles).not.toBeNull()
      expect(Array.isArray(styles)).toBe(false)
    })

    it('should handle complex style merging scenarios', () => {
      const style1 = {
        color: 'red',
        '&:hover': { opacity: 0.8 },
        padding: { xs: 1, md: 2 }
      }
      const style2 = {
        color: 'blue',
        '&:hover': { color: 'green' },
        margin: 1
      }
      
      const merged = mergeStyles(style1, style2)
      
      expect(merged.color).toBe('blue')
      expect(merged['&:hover']).toEqual({ color: 'green' })
      expect(merged.margin).toBe(1)
      expect(merged.padding).toEqual({ xs: 1, md: 2 })
    })
  })

  describe('performance considerations', () => {
    it('should handle many style merges efficiently', () => {
      const styles = Array.from({ length: 50 }, (_, i) => ({
        [`prop${i}`]: `value${i}`
      }))
      
      const startTime = performance.now()
      const merged = mergeStyles(...styles)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(10) // Should be fast
      expect(Object.keys(merged)).toHaveLength(50)
    })

    it('should create consistent style objects', () => {
      const styles1 = getClickableStyles(true, 0.8)
      const styles2 = getClickableStyles(true, 0.8)
      
      expect(styles1).toEqual(styles2)
    })

    it('should handle repeated function calls efficiently', () => {
      const startTime = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        getClickableStyles(true)
        getDisabledStyles(false)
        getCenterStyles()
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(50) // Should be very fast
    })
  })
})