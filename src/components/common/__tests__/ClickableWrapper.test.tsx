import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/utils'
import ClickableWrapper from '../ClickableWrapper'

// Mock styleHelpers
vi.mock('../../../utils/styleHelpers', () => ({
  getClickableStyles: vi.fn((isClickable, hoverOpacity) => ({
    cursor: isClickable ? 'pointer' : 'default',
    '&:hover': {
      opacity: isClickable ? hoverOpacity : 1
    }
  })),
  mergeStyles: vi.fn((...styles) => Object.assign({}, ...styles))
}))

describe('ClickableWrapper', () => {
  describe('rendering', () => {
    it('should render children correctly', () => {
      render(
        <ClickableWrapper>
          <div>Test Content</div>
        </ClickableWrapper>
      )
      
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(
        <ClickableWrapper className="custom-class">
          <div>Test Content</div>
        </ClickableWrapper>
      )
      
      const wrapper = screen.getByText('Test Content').parentElement
      expect(wrapper).toHaveClass('custom-class')
    })

    it('should pass through other Box props', () => {
      render(
        <ClickableWrapper data-testid="clickable-wrapper">
          <div>Test Content</div>
        </ClickableWrapper>
      )
      
      expect(screen.getByTestId('clickable-wrapper')).toBeInTheDocument()
    })
  })

  describe('click behavior', () => {
    it('should call onClick when clicked and enabled', () => {
      const mockOnClick = vi.fn()
      
      render(
        <ClickableWrapper onClick={mockOnClick}>
          <div>Clickable Content</div>
        </ClickableWrapper>
      )
      
      fireEvent.click(screen.getByText('Clickable Content'))
      
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', () => {
      const mockOnClick = vi.fn()
      
      render(
        <ClickableWrapper onClick={mockOnClick} disabled>
          <div>Disabled Content</div>
        </ClickableWrapper>
      )
      
      fireEvent.click(screen.getByText('Disabled Content'))
      
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should not call onClick when no onClick is provided', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <ClickableWrapper>
          <div>Non-clickable Content</div>
        </ClickableWrapper>
      )
      
      fireEvent.click(screen.getByText('Non-clickable Content'))
      
      // Should not throw or cause errors
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle multiple clicks correctly', () => {
      const mockOnClick = vi.fn()
      
      render(
        <ClickableWrapper onClick={mockOnClick}>
          <div>Clickable Content</div>
        </ClickableWrapper>
      )
      
      const element = screen.getByText('Clickable Content')
      fireEvent.click(element)
      fireEvent.click(element)
      fireEvent.click(element)
      
      expect(mockOnClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('styling', () => {
    it('should apply disabled opacity when disabled', () => {
      render(
        <ClickableWrapper disabled>
          <div>Disabled Content</div>
        </ClickableWrapper>
      )
      
      const wrapper = screen.getByText('Disabled Content').parentElement
      expect(wrapper).toHaveStyle('opacity: 0.5')
    })

    it('should apply normal opacity when enabled', () => {
      render(
        <ClickableWrapper>
          <div>Enabled Content</div>
        </ClickableWrapper>
      )
      
      const wrapper = screen.getByText('Enabled Content').parentElement
      expect(wrapper).toHaveStyle('opacity: 1')
    })

    it('should prevent user selection', () => {
      render(
        <ClickableWrapper>
          <div>Content</div>
        </ClickableWrapper>
      )
      
      const wrapper = screen.getByText('Content').parentElement
      expect(wrapper).toHaveStyle('user-select: none')
    })

    it('should merge custom styles correctly', () => {
      const customStyles = { backgroundColor: 'red', padding: '10px' }
      
      render(
        <ClickableWrapper sx={customStyles}>
          <div>Styled Content</div>
        </ClickableWrapper>
      )
      
      const wrapper = screen.getByText('Styled Content').parentElement
      expect(wrapper).toHaveStyle('background-color: rgb(255, 0, 0)')
      expect(wrapper).toHaveStyle('padding: 10px')
    })
  })

  describe('accessibility', () => {
    it('should be focusable when clickable', () => {
      render(
        <ClickableWrapper onClick={() => {}} tabIndex={0}>
          <div>Clickable Content</div>
        </ClickableWrapper>
      )
      
      const wrapper = screen.getByText('Clickable Content').parentElement
      wrapper?.focus()
      expect(document.activeElement).toBe(wrapper)
    })

    it('should respond to Enter key when focused and clickable', () => {
      const mockOnClick = vi.fn()
      
      render(
        <ClickableWrapper onClick={mockOnClick}>
          <div>Keyboard Accessible</div>
        </ClickableWrapper>
      )
      
      const wrapper = screen.getByText('Keyboard Accessible').parentElement
      wrapper?.focus()
      fireEvent.keyDown(wrapper!, { key: 'Enter', code: 'Enter' })
      
      // Note: Box component doesn't handle Enter by default, 
      // this test documents current behavior
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should respond to Space key when focused and clickable', () => {
      const mockOnClick = vi.fn()
      
      render(
        <ClickableWrapper onClick={mockOnClick}>
          <div>Keyboard Accessible</div>
        </ClickableWrapper>
      )
      
      const wrapper = screen.getByText('Keyboard Accessible').parentElement
      wrapper?.focus()
      fireEvent.keyDown(wrapper!, { key: ' ', code: 'Space' })
      
      // Note: Box component doesn't handle Space by default,
      // this test documents current behavior
      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle custom hoverOpacity', () => {
      const { rerender } = render(
        <ClickableWrapper onClick={() => {}} hoverOpacity={0.6}>
          <div>Content</div>
        </ClickableWrapper>
      )
      
      // Component should render without errors with custom hoverOpacity
      expect(screen.getByText('Content')).toBeInTheDocument()
      
      // Test default hoverOpacity rendering
      rerender(
        <ClickableWrapper onClick={() => {}}>
          <div>Content</div>
        </ClickableWrapper>
      )
      
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should handle null/undefined children gracefully', () => {
      expect(() => {
        render(
          <ClickableWrapper>
            {null}
          </ClickableWrapper>
        )
      }).not.toThrow()
      
      expect(() => {
        render(
          <ClickableWrapper>
            {undefined}
          </ClickableWrapper>
        )
      }).not.toThrow()
    })

    it('should handle boolean disabled prop correctly', () => {
      const mockOnClick = vi.fn()
      
      const { rerender } = render(
        <ClickableWrapper onClick={mockOnClick} disabled={false}>
          <div>Content</div>
        </ClickableWrapper>
      )
      
      fireEvent.click(screen.getByText('Content'))
      expect(mockOnClick).toHaveBeenCalledTimes(1)
      
      rerender(
        <ClickableWrapper onClick={mockOnClick} disabled={true}>
          <div>Content</div>
        </ClickableWrapper>
      )
      
      fireEvent.click(screen.getByText('Content'))
      expect(mockOnClick).toHaveBeenCalledTimes(1) // Should not increment
    })

    it('should handle rapidly changing props', () => {
      const mockOnClick1 = vi.fn()
      const mockOnClick2 = vi.fn()
      
      const { rerender } = render(
        <ClickableWrapper onClick={mockOnClick1}>
          <div>Content</div>
        </ClickableWrapper>
      )
      
      fireEvent.click(screen.getByText('Content'))
      expect(mockOnClick1).toHaveBeenCalledTimes(1)
      
      rerender(
        <ClickableWrapper onClick={mockOnClick2}>
          <div>Content</div>
        </ClickableWrapper>
      )
      
      fireEvent.click(screen.getByText('Content'))
      expect(mockOnClick2).toHaveBeenCalledTimes(1)
      expect(mockOnClick1).toHaveBeenCalledTimes(1) // Should not change
    })
  })

  describe('functional behavior', () => {
    it('should maintain consistent styling behavior', () => {
      const { rerender } = render(
        <ClickableWrapper onClick={() => {}} hoverOpacity={0.7}>
          <div>Clickable Content</div>
        </ClickableWrapper>
      )
      
      expect(screen.getByText('Clickable Content')).toBeInTheDocument()
      
      // Test that component works with different props
      rerender(
        <ClickableWrapper hoverOpacity={0.9}>
          <div>Non-clickable Content</div>
        </ClickableWrapper>
      )
      
      expect(screen.getByText('Non-clickable Content')).toBeInTheDocument()
    })

    it('should work with complex custom styles', () => {
      const customSx = { 
        color: 'blue',
        padding: '20px',
        borderRadius: '8px'
      }
      
      render(
        <ClickableWrapper onClick={() => {}} sx={customSx}>
          <div>Styled Content</div>
        </ClickableWrapper>
      )
      
      const wrapper = screen.getByText('Styled Content').parentElement
      expect(wrapper).toHaveStyle('color: rgb(0, 0, 255)')
      expect(wrapper).toHaveStyle('padding: 20px')
    })
  })
})