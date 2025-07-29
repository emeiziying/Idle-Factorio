# Testing Guide

This document provides comprehensive information about the testing setup and approach for the Idle Factorio project.

## Overview

This project uses a modern testing stack with Vitest, React Testing Library, and comprehensive mocking strategies to ensure code quality and reliability.

## Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast, modern test runner with built-in TypeScript support
- **React Testing**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Simple and complete testing utilities for React components
- **Mocking**: Vitest's built-in mocking capabilities with manual mocks for complex dependencies
- **Coverage**: V8 coverage provider for detailed test coverage reports
- **Environment**: jsdom for browser-like testing environment

## Setup

### Dependencies

The following testing dependencies are included:

```json
{
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/react": "^16.1.0", 
  "@testing-library/user-event": "^14.5.2",
  "@vitest/coverage-v8": "^2.1.8",
  "@vitest/ui": "^2.1.8",
  "jsdom": "^26.0.0",
  "vitest": "^2.1.8"
}
```

### Configuration

- **vitest.config.ts**: Main Vitest configuration with React plugin and coverage settings
- **src/test/setup.ts**: Global test setup with mocks for browser APIs and console methods
- **src/test/utils.tsx**: Custom testing utilities and component renderers

## Test Scripts

```bash
# Run tests in watch mode
pnpm test

# Run tests with UI interface
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

## Testing Structure

### Directory Structure

```
src/
├── test/
│   ├── setup.ts          # Global test setup
│   └── utils.tsx          # Testing utilities
├── utils/__tests__/       # Utility function tests
├── hooks/__tests__/       # Custom hook tests
├── services/__tests__/    # Service layer tests
├── store/__tests__/       # State management tests
└── components/**/__tests__/ # Component tests
```

### Test Categories

#### 1. Unit Tests

**Utility Functions** (`src/utils/__tests__/`)
- Mathematical calculations
- String/array manipulations
- Logger functionality
- Common helper functions

Example: `common.test.ts` tests mathematical operations, debounce/throttle functions, and data transformations.

**Custom Hooks** (`src/hooks/__tests__/`)
- React hook behavior
- State management
- Side effects
- Local storage integration

Example: `usePersistentState.test.ts` tests localStorage integration, error handling, and state persistence.

#### 2. Integration Tests

**Services** (`src/services/__tests__/`)
- Business logic
- Data fetching and caching
- Error handling
- Service interactions

Example: `DataService.test.ts` tests singleton patterns, caching mechanisms, and data transformation.

**State Management** (`src/store/__tests__/`)
- Zustand store operations
- Complex state mutations
- Side effects
- Service integration

Example: `gameStore.test.ts` tests inventory management, crafting queues, and technology progression.

#### 3. Component Tests

**UI Components** (`src/components/**/__tests__/`)
- Component rendering
- User interactions
- Props handling
- Accessibility

Example: `ClickableWrapper.test.tsx` tests click handling, styling, and accessibility features.

## Testing Patterns

### Mocking Strategy

#### Service Mocks
```typescript
vi.mock('../../services/DataService', () => ({
  DataService: {
    getInstance: () => ({
      getItem: vi.fn(),
      getAllItems: vi.fn(() => [])
    })
  }
}))
```

#### Browser API Mocks
```typescript
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
```

### Test Data Factories

Reusable test data generators for consistent test objects:

```typescript
export const createMockItem = (overrides = {}) => ({
  name: 'test-item',
  displayName: 'Test Item',
  category: 'test',
  stackSize: 100,
  ...overrides,
})
```

### Component Testing Patterns

#### Custom Render with Providers
```typescript
const customRender = (ui: React.ReactElement, options?: RenderOptions) => 
  render(ui, { wrapper: AllTheProviders, ...options })
```

#### User Interaction Testing
```typescript
import { fireEvent, screen } from '@testing-library/react'

fireEvent.click(screen.getByText('Click me'))
expect(mockOnClick).toHaveBeenCalledTimes(1)
```

## Coverage Goals

- **Utilities**: 90%+ coverage (pure functions, critical business logic)
- **Services**: 85%+ coverage (data handling, caching, error scenarios)
- **Hooks**: 85%+ coverage (state management, side effects)
- **Components**: 80%+ coverage (user interactions, rendering)
- **Overall**: 85%+ coverage

## Best Practices

### Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern
- Test both positive and negative scenarios

### Mocking Guidelines
- Mock external dependencies but not internal logic
- Use factory functions for consistent test data
- Reset mocks between tests to prevent interference
- Mock at the module level for consistent behavior

### Error Handling
- Test error scenarios and edge cases
- Verify error messages and recovery behavior
- Test async error handling with proper Promise assertions

### Performance
- Use `vi.useFakeTimers()` for time-dependent tests
- Batch similar tests to reduce setup overhead
- Use parallel test execution for independent tests

## Common Testing Scenarios

### Testing Async Operations
```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction()
  expect(result).toEqual(expectedValue)
})
```

### Testing State Changes
```typescript
it('should update state correctly', () => {
  const { result } = renderHook(() => useCustomHook())
  
  act(() => {
    result.current.updateState('new value')
  })
  
  expect(result.current.state).toBe('new value')
})
```

### Testing Error Boundaries
```typescript
it('should handle errors gracefully', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  
  expect(() => {
    render(<ComponentThatMightThrow />)
  }).not.toThrow()
  
  spy.mockRestore()
})
```

## Debugging Tests

### Running Specific Tests
```bash
# Run specific test file
pnpm test common.test.ts

# Run tests matching pattern
pnpm test --grep "inventory"

# Run tests in specific directory
pnpm test src/utils
```

### Debug Mode
```bash
# Run with debug output
pnpm test --reporter=verbose

# Run with UI for visual debugging
pnpm test:ui
```

### Common Issues

1. **Mock not working**: Ensure mock is declared before imports
2. **Async test failing**: Use proper async/await or return Promise
3. **Component not rendering**: Check for missing providers or context
4. **Timer-related tests**: Use `vi.useFakeTimers()` and `vi.advanceTimersByTime()`

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Pre-commit hooks (if configured)

Coverage reports are generated and can be viewed in the CI artifacts.

## Future Improvements

- **Visual regression testing**: Add screenshot testing for UI components
- **E2E testing**: Implement Playwright for full application testing
- **Performance testing**: Add benchmarks for critical operations
- **Mutation testing**: Verify test quality with mutation testing tools
- **API testing**: Add contract testing for external API interactions

---

This testing setup provides a solid foundation for maintaining code quality and catching regressions early in the development process.