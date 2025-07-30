// Test utility types for mocking and testing

// Service instance type for accessing private properties
export type ServiceInstance<T> = T & {
  instance?: T | null
  allRecipes?: unknown[]
  recipesByItem?: Map<string, unknown>
}

// Mock function type
export type MockFunction<T extends (...args: unknown[]) => unknown> = T & {
  mock: {
    calls: Parameters<T>[]
    results: { type: 'return'; value: ReturnType<T> }[]
    lastCall?: Parameters<T>
  }
}

// Generic mock object type
export type MockObject<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown
    ? MockFunction<T[K]>
    : T[K]
}

// Console mock type
export type ConsoleMock = {
  log: MockFunction<typeof console.log>
  error: MockFunction<typeof console.error>
  warn: MockFunction<typeof console.warn>
  info: MockFunction<typeof console.info>
}

// Storage mock type for localStorage/sessionStorage
export type StorageMock = {
  getItem: MockFunction<(...args: unknown[]) => string | null>
  setItem: MockFunction<(...args: unknown[]) => void>
  removeItem: MockFunction<(...args: unknown[]) => void>
  clear: MockFunction<() => void>
}

// Style object type for CSS-in-JS
export type StyleObject = Record<string, string | number | Record<string, unknown>>

// Vitest mock type helper
export type VitestMock<T extends (...args: unknown[]) => unknown> = T & {
  mockReturnValue: (value: ReturnType<T>) => void
  mockImplementation: (fn: T) => void
  mockResolvedValue: T extends (...args: unknown[]) => Promise<infer R> ? (value: R) => void : never
  mockRejectedValue: (error: Error) => void
}