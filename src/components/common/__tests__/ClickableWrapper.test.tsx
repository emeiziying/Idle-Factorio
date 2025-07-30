import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ClickableWrapper } from '../ClickableWrapper'

import * as styleHelpers from '../../../utils/styleHelpers'

// Mock style helpers
// 模拟样式辅助函数
vi.mock('../../../utils/styleHelpers', () => ({
  getClickableStyles: vi.fn((isClickable, hoverOpacity) => ({
    cursor: isClickable ? 'pointer' : 'default',
    transition: 'opacity 0.2s',
    '&:hover': isClickable ? { opacity: hoverOpacity } : {},
    '&:active': isClickable ? { opacity: hoverOpacity - 0.1 } : {},
  })),
  mergeStyles: vi.fn((...styles) => Object.assign({}, ...styles.filter(Boolean)))
}))

// ClickableWrapper 组件测试套件
describe('ClickableWrapper', () => {
  // 测试：应该正确渲染子元素
  it('should render children', () => {
    render(
      <ClickableWrapper>
        <div>Test Content</div>
      </ClickableWrapper>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  // 测试：当提供 onClick 回调时应该处理点击事件
  it('should handle click events when onClick is provided', () => {
    const handleClick = vi.fn()
    
    render(
      <ClickableWrapper onClick={handleClick}>
        <div>Click Me</div>
      </ClickableWrapper>
    )
    
    const wrapper = screen.getByText('Click Me').parentElement!
    fireEvent.click(wrapper)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  // 测试：当组件被禁用时不应该处理点击
  it('should not handle clicks when disabled', () => {
    const handleClick = vi.fn()
    
    render(
      <ClickableWrapper onClick={handleClick} disabled>
        <div>Disabled</div>
      </ClickableWrapper>
    )
    
    const wrapper = screen.getByText('Disabled').parentElement!
    fireEvent.click(wrapper)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  // 测试：当组件被禁用时应该应用禁用样式
  it('should apply disabled styles when disabled', () => {
    const { container } = render(
      <ClickableWrapper disabled>
        <div>Disabled Content</div>
      </ClickableWrapper>
    )
    
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveStyle({ opacity: '0.5' })
  })

  // 测试：当提供 onClick 时应该应用可点击样式
  it('should apply clickable styles when onClick is provided', () => {
    const { container } = render(
      <ClickableWrapper onClick={() => {}}>
        <div>Clickable</div>
      </ClickableWrapper>
    )
    
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveStyle({ 
      cursor: 'pointer',
      userSelect: 'none'
    })
  })

  // 测试：当没有 onClick 时应该应用不可点击样式
  it('should apply non-clickable styles when no onClick', () => {
    const { container } = render(
      <ClickableWrapper>
        <div>Not Clickable</div>
      </ClickableWrapper>
    )
    
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveStyle({ 
      cursor: 'default',
      userSelect: 'none'
    })
  })

  // 测试：应该使用自定义的悬停透明度
  it('should use custom hover opacity', () => {
    const customOpacity = 0.6
    
    render(
      <ClickableWrapper onClick={() => {}} hoverOpacity={customOpacity}>
        <div>Custom Hover</div>
      </ClickableWrapper>
    )
    
    // Check that getClickableStyles was called with custom opacity
    // 检查 getClickableStyles 是否使用自定义透明度调用
    expect(styleHelpers.getClickableStyles).toHaveBeenCalledWith(true, customOpacity)
  })

  // 测试：应该合并自定义样式
  it('should merge custom styles', () => {
    const customStyles = {
      backgroundColor: 'red',
      padding: 2
    }
    
    const { container } = render(
      <ClickableWrapper sx={customStyles}>
        <div>Styled</div>
      </ClickableWrapper>
    )
    
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveStyle({
      backgroundColor: 'red'
    })
  })

  // 测试：应该传递其他 Box 属性
  it('should pass through other Box props', () => {
    render(
      <ClickableWrapper 
        data-testid="custom-wrapper"
        className="custom-class"
        id="custom-id"
      >
        <div>Props Test</div>
      </ClickableWrapper>
    )
    
    const wrapper = screen.getByTestId('custom-wrapper')
    expect(wrapper).toHaveClass('custom-class')
    expect(wrapper).toHaveAttribute('id', 'custom-id')
  })

  // 测试：应该处理多个子元素
  it('should handle multiple children', () => {
    render(
      <ClickableWrapper>
        <div>Child 1</div>
        <div>Child 2</div>
        <span>Child 3</span>
      </ClickableWrapper>
    )
    
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByText('Child 3')).toBeInTheDocument()
  })

  // 测试：当点击禁用的包装器时不应触发 onClick
  it('should not fire onClick when clicking on disabled wrapper', () => {
    const handleClick = vi.fn()
    
    const { rerender } = render(
      <ClickableWrapper onClick={handleClick}>
        <div>Toggle Disabled</div>
      </ClickableWrapper>
    )
    
    // Click when enabled
    // 启用时点击
    fireEvent.click(screen.getByText('Toggle Disabled').parentElement!)
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    // Disable and try to click
    // 禁用后尝试点击
    rerender(
      <ClickableWrapper onClick={handleClick} disabled>
        <div>Toggle Disabled</div>
      </ClickableWrapper>
    )
    
    fireEvent.click(screen.getByText('Toggle Disabled').parentElement!)
    expect(handleClick).toHaveBeenCalledTimes(1) // Still 1, no new call // 仍然是 1，没有新的调用
  })

  // 测试：应该处理 onClick 为 undefined 的情况
  it('should handle onClick being undefined', () => {
    const { container } = render(
      <ClickableWrapper onClick={undefined}>
        <div>No Handler</div>
      </ClickableWrapper>
    )
    
    const wrapper = container.firstChild as HTMLElement
    
    // Should not throw when clicked
    // 点击时不应抛出错误
    expect(() => fireEvent.click(wrapper)).not.toThrow()
  })
})