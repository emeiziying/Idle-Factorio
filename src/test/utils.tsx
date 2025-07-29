import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from '../theme'

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Common test data generators
export const createMockItem = (overrides = {}) => ({
  name: 'test-item',
  displayName: 'Test Item',
  category: 'test',
  stackSize: 100,
  ...overrides,
})

export const createMockRecipe = (overrides = {}) => ({
  name: 'test-recipe',
  displayName: 'Test Recipe',
  category: 'test',
  ingredients: [{ name: 'test-ingredient', amount: 1 }],
  results: [{ name: 'test-result', amount: 1 }],
  craftingTime: 1,
  ...overrides,
})

export const createMockFacility = (overrides = {}) => ({
  name: 'test-facility',
  displayName: 'Test Facility',
  category: 'test',
  craftingSpeed: 1,
  energyUsage: 100,
  ...overrides,
})

// Mock game store state
export const createMockGameState = (overrides = {}) => ({
  inventory: {},
  facilities: [],
  unlockedTechs: [],
  ...overrides,
})