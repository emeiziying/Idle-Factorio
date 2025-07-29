/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Logger, { logger, LogLevel, debug, info, warn, error } from '../logger'

describe('Logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>
    info: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    }
    
    // Reset logger config to default
    logger.configure({
      level: LogLevel.DEBUG,
      enableInProduction: false,
      prefix: '[Game]'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('log levels', () => {
    it('should log all levels when level is DEBUG', () => {
      logger.configure({ level: LogLevel.DEBUG })
      
      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      expect(consoleSpy.log).toHaveBeenCalledTimes(1)
      expect(consoleSpy.info).toHaveBeenCalledTimes(1)
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1)
      expect(consoleSpy.error).toHaveBeenCalledTimes(1)
    })

    it('should not log debug when level is INFO', () => {
      logger.configure({ level: LogLevel.INFO })
      
      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      expect(consoleSpy.log).not.toHaveBeenCalled()
      expect(consoleSpy.info).toHaveBeenCalledTimes(1)
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1)
      expect(consoleSpy.error).toHaveBeenCalledTimes(1)
    })

    it('should only log error when level is ERROR', () => {
      logger.configure({ level: LogLevel.ERROR })
      
      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      expect(consoleSpy.log).not.toHaveBeenCalled()
      expect(consoleSpy.info).not.toHaveBeenCalled()
      expect(consoleSpy.warn).not.toHaveBeenCalled()
      expect(consoleSpy.error).toHaveBeenCalledTimes(1)
    })

    it('should not log anything when level is NONE', () => {
      logger.configure({ level: LogLevel.NONE })
      
      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      expect(consoleSpy.log).not.toHaveBeenCalled()
      expect(consoleSpy.info).not.toHaveBeenCalled()
      expect(consoleSpy.warn).not.toHaveBeenCalled()
      expect(consoleSpy.error).not.toHaveBeenCalled()
    })
  })

  describe('message formatting', () => {
    it('should format messages with prefix and level', () => {
      logger.configure({ prefix: '[Test]' })
      
      logger.info('test message')

      expect(consoleSpy.info).toHaveBeenCalled()
      const call = consoleSpy.info.mock.calls[0]
      expect(call[0]).toMatch(/\[Test\]/)
      expect(call[0]).toMatch(/\[INFO\]/)
      expect(call[0]).toMatch(/test message/)
    })

    it('should include timestamp in messages', () => {
      logger.info('test message')

      const call = consoleSpy.info.mock.calls[0]
      expect(call[0]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should pass additional arguments', () => {
      const obj = { foo: 'bar' }
      const arr = [1, 2, 3]
      
      logger.info('test message', obj, arr)

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('test message'),
        obj,
        arr
      )
    })
  })

  describe('production mode', () => {
    const originalLocation = window.location

    beforeEach(() => {
      delete (window as any).location
      window.location = { ...originalLocation, hostname: 'production.com' } as Location
    })

    afterEach(() => {
      window.location = originalLocation
    })

    it('should not log in production by default', () => {
      const prodLogger = new Logger()
      prodLogger.debug('debug message')
      prodLogger.info('info message')

      expect(consoleSpy.log).not.toHaveBeenCalled()
      expect(consoleSpy.info).not.toHaveBeenCalled()
    })

    it('should log in production when enableInProduction is true', () => {
      const prodLogger = new Logger()
      prodLogger.configure({ enableInProduction: true, level: LogLevel.DEBUG })
      
      prodLogger.debug('debug message')
      prodLogger.error('error message')

      expect(consoleSpy.log).toHaveBeenCalledTimes(1)
      expect(consoleSpy.error).toHaveBeenCalledTimes(1)
    })
  })

  describe('child loggers', () => {
    it('should create child logger with combined prefix', () => {
      const child = logger.createChild('Child')
      
      child.info('child message')

      const call = consoleSpy.info.mock.calls[0]
      expect(call[0]).toMatch(/\[Game\] \[Child\]/)
      expect(call[0]).toMatch(/child message/)
    })

    it('should inherit parent configuration', () => {
      logger.configure({ level: LogLevel.WARN })
      const child = logger.createChild('Child')
      
      child.debug('should not log')
      child.info('should not log')
      child.warn('should log')

      expect(consoleSpy.log).not.toHaveBeenCalled()
      expect(consoleSpy.info).not.toHaveBeenCalled()
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1)
    })

    it('should allow nested children', () => {
      const child1 = logger.createChild('Module1')
      const child2 = child1.createChild('SubModule')
      
      child2.info('nested message')

      const call = consoleSpy.info.mock.calls[0]
      expect(call[0]).toMatch(/\[Game\] \[Module1\] \[SubModule\]/)
    })
  })

  describe('exported convenience functions', () => {
    it('should work with debug function', () => {
      debug('debug message', 123)

      expect(consoleSpy.log).toHaveBeenCalled()
      const call = consoleSpy.log.mock.calls[0]
      expect(call[0]).toMatch(/debug message/)
      expect(call[1]).toBe(123)
    })

    it('should work with info function', () => {
      info('info message', { data: 'test' })

      expect(consoleSpy.info).toHaveBeenCalled()
      const call = consoleSpy.info.mock.calls[0]
      expect(call[0]).toMatch(/info message/)
      expect(call[1]).toEqual({ data: 'test' })
    })

    it('should work with warn function', () => {
      warn('warning message')

      expect(consoleSpy.warn).toHaveBeenCalled()
      expect(consoleSpy.warn.mock.calls[0][0]).toMatch(/warning message/)
    })

    it('should work with error function', () => {
      error('error message', new Error('test error'))

      expect(consoleSpy.error).toHaveBeenCalled()
      const call = consoleSpy.error.mock.calls[0]
      expect(call[0]).toMatch(/error message/)
      expect(call[1]).toBeInstanceOf(Error)
    })
  })

  describe('configuration', () => {
    it('should update configuration', () => {
      logger.configure({
        level: LogLevel.ERROR,
        prefix: '[Custom]',
        enableInProduction: true
      })

      logger.debug('should not log')
      logger.error('should log')

      expect(consoleSpy.log).not.toHaveBeenCalled()
      expect(consoleSpy.error).toHaveBeenCalledTimes(1)
      expect(consoleSpy.error.mock.calls[0][0]).toMatch(/\[Custom\]/)
    })

    it('should merge partial configuration', () => {
      logger.configure({ prefix: '[Original]' })
      logger.configure({ level: LogLevel.WARN })

      logger.info('should not log')
      logger.warn('should log')

      expect(consoleSpy.info).not.toHaveBeenCalled()
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1)
      expect(consoleSpy.warn.mock.calls[0][0]).toMatch(/\[Original\]/)
    })
  })
})