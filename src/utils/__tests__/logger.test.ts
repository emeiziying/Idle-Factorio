import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Logger, { LogLevel, logger, debug, info, warn, error } from '../logger'

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock window object
const mockWindow = {
  location: {
    hostname: 'localhost'
  }
}

describe('Logger', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Mock console methods
    global.console = { ...console, ...mockConsole }
    // Mock window object
    global.window = mockWindow as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('LogLevel', () => {
    it('should have correct log level values', () => {
      expect(LogLevel.DEBUG).toBe(0)
      expect(LogLevel.INFO).toBe(1)
      expect(LogLevel.WARN).toBe(2)
      expect(LogLevel.ERROR).toBe(3)
      expect(LogLevel.NONE).toBe(4)
    })
  })

  describe('Logger class', () => {
    let testLogger: Logger

    beforeEach(() => {
      testLogger = new Logger()
    })

    describe('configuration', () => {
      it('should initialize with default config for localhost', () => {
        global.window.location.hostname = 'localhost'
        const localLogger = new Logger()
        
        localLogger.debug('test message')
        expect(mockConsole.log).toHaveBeenCalled()
      })

      it('should initialize with production config for non-localhost', () => {
        global.window.location.hostname = 'example.com'
        const prodLogger = new Logger()
        
        prodLogger.debug('test message')
        expect(mockConsole.log).not.toHaveBeenCalled()
      })

      it('should allow configuration updates', () => {
        testLogger.configure({
          level: LogLevel.WARN,
          enableInProduction: true,
          prefix: '[Test]'
        })

        testLogger.info('test message')
        expect(mockConsole.info).not.toHaveBeenCalled()

        testLogger.warn('test message')
        expect(mockConsole.warn).toHaveBeenCalled()
      })
    })

    describe('log level filtering', () => {
      beforeEach(() => {
        testLogger.configure({ level: LogLevel.WARN })
      })

      it('should filter out logs below the configured level', () => {
        testLogger.debug('debug message')
        testLogger.info('info message')
        testLogger.warn('warn message')
        testLogger.error('error message')

        expect(mockConsole.log).not.toHaveBeenCalled()
        expect(mockConsole.info).not.toHaveBeenCalled()
        expect(mockConsole.warn).toHaveBeenCalled()
        expect(mockConsole.error).toHaveBeenCalled()
      })
    })

    describe('production environment handling', () => {
      beforeEach(() => {
        global.window.location.hostname = 'production.com'
      })

      it('should not log in production by default', () => {
        testLogger.error('error message')
        expect(mockConsole.error).not.toHaveBeenCalled()
      })

      it('should log in production when explicitly enabled', () => {
        testLogger.configure({ enableInProduction: true })
        testLogger.error('error message')
        expect(mockConsole.error).toHaveBeenCalled()
      })
    })

    describe('message formatting', () => {
      beforeEach(() => {
        testLogger.configure({ 
          level: LogLevel.DEBUG,
          prefix: '[Test]'
        })
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2023-01-01T12:00:00.000Z'))
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it('should format debug messages correctly', () => {
        testLogger.debug('test message')
        expect(mockConsole.log).toHaveBeenCalledWith(
          '[Test] [2023-01-01T12:00:00.000Z] [DEBUG] test message'
        )
      })

      it('should format info messages correctly', () => {
        testLogger.info('test message')
        expect(mockConsole.info).toHaveBeenCalledWith(
          '[Test] [2023-01-01T12:00:00.000Z] [INFO] test message'
        )
      })

      it('should format warn messages correctly', () => {
        testLogger.warn('test message')
        expect(mockConsole.warn).toHaveBeenCalledWith(
          '[Test] [2023-01-01T12:00:00.000Z] [WARN] test message'
        )
      })

      it('should format error messages correctly', () => {
        testLogger.error('test message')
        expect(mockConsole.error).toHaveBeenCalledWith(
          '[Test] [2023-01-01T12:00:00.000Z] [ERROR] test message'
        )
      })
    })

    describe('additional arguments', () => {
      beforeEach(() => {
        testLogger.configure({ level: LogLevel.DEBUG })
      })

      it('should pass additional arguments to console methods', () => {
        const obj = { key: 'value' }
        const arr = [1, 2, 3]

        testLogger.debug('test message', obj, arr)
        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringContaining('test message'),
          obj,
          arr
        )
      })
    })

    describe('child loggers', () => {
      beforeEach(() => {
        testLogger.configure({
          level: LogLevel.DEBUG,
          prefix: '[Parent]'
        })
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2023-01-01T12:00:00.000Z'))
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it('should create child loggers with inherited config', () => {
        const childLogger = testLogger.createChild('Child')
        
        childLogger.info('test message')
        expect(mockConsole.info).toHaveBeenCalledWith(
          '[Parent] [Child] [2023-01-01T12:00:00.000Z] [INFO] test message'
        )
      })

      it('should inherit log level from parent', () => {
        testLogger.configure({ level: LogLevel.WARN })
        const childLogger = testLogger.createChild('Child')
        
        childLogger.info('should not log')
        childLogger.warn('should log')
        
        expect(mockConsole.info).not.toHaveBeenCalled()
        expect(mockConsole.warn).toHaveBeenCalled()
      })
    })

    describe('edge cases', () => {
      it('should handle undefined window object', () => {
        const originalWindow = global.window
        delete (global as any).window

        const serverLogger = new Logger()
        serverLogger.debug('test message')
        
        // Should work without throwing
        expect(mockConsole.log).toHaveBeenCalled()
        
        global.window = originalWindow
      })

      it('should handle NONE log level', () => {
        testLogger.configure({ level: LogLevel.NONE })
        
        testLogger.debug('debug')
        testLogger.info('info')
        testLogger.warn('warn')
        testLogger.error('error')
        
        expect(mockConsole.log).not.toHaveBeenCalled()
        expect(mockConsole.info).not.toHaveBeenCalled()
        expect(mockConsole.warn).not.toHaveBeenCalled()
        expect(mockConsole.error).not.toHaveBeenCalled()
      })
    })
  })

  describe('exported functions', () => {
    beforeEach(() => {
      logger.configure({ 
        level: LogLevel.DEBUG,
        enableInProduction: true
      })
    })

    it('should export convenience functions that work correctly', () => {
      debug('debug message')
      info('info message')
      warn('warn message')
      error('error message')

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('debug message')
      )
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('info message')
      )
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('warn message')
      )
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('error message')
      )
    })

    it('should bind context correctly', () => {
      const unboundDebug = debug
      const unboundInfo = info
      const unboundWarn = warn
      const unboundError = error

      unboundDebug('debug')
      unboundInfo('info')
      unboundWarn('warn')
      unboundError('error')

      expect(mockConsole.log).toHaveBeenCalled()
      expect(mockConsole.info).toHaveBeenCalled()
      expect(mockConsole.warn).toHaveBeenCalled()
      expect(mockConsole.error).toHaveBeenCalled()
    })
  })
})