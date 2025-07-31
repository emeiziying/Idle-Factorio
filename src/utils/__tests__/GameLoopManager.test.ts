import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import GameLoopManager from '../GameLoopManager';

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();

Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true,
});

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true,
});

// Mock performance.now
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true,
});

describe('GameLoopManager', () => {
  let gameLoopManager: GameLoopManager;
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockRequestAnimationFrame.mockImplementation((callback) => {
      setTimeout(callback, 16); // Simulate 60fps
      return 1;
    });
    mockPerformanceNow.mockReturnValue(0);
    
    // Get fresh instance
    gameLoopManager = GameLoopManager.getInstance();
    gameLoopManager.clear(); // Clear any existing tasks
    
    mockCallback = vi.fn();
  });

  afterEach(() => {
    gameLoopManager.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = GameLoopManager.getInstance();
      const instance2 = GameLoopManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Task Registration', () => {
    it('should register a task', () => {
      gameLoopManager.register('test-task', mockCallback, 1000);
      const task = gameLoopManager.getTaskInfo('test-task');
      
      expect(task).toBeDefined();
      expect(task?.id).toBe('test-task');
      expect(task?.callback).toBe(mockCallback);
      expect(task?.interval).toBe(1000);
      expect(task?.enabled).toBe(true);
    });

    it('should start the loop when registering first task', () => {
      gameLoopManager.register('test-task', mockCallback, 1000);
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should register multiple tasks', () => {
      const callback2 = vi.fn();
      
      gameLoopManager.register('task1', mockCallback, 1000);
      gameLoopManager.register('task2', callback2, 500);
      
      expect(gameLoopManager.getAllTasks()).toHaveLength(2);
    });
  });

  describe('Task Unregistration', () => {
    it('should unregister a task', () => {
      gameLoopManager.register('test-task', mockCallback, 1000);
      gameLoopManager.unregister('test-task');
      
      const task = gameLoopManager.getTaskInfo('test-task');
      expect(task).toBeUndefined();
    });

    it('should stop the loop when all tasks are unregistered', () => {
      gameLoopManager.register('test-task', mockCallback, 1000);
      gameLoopManager.unregister('test-task');
      
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Task Control', () => {
    beforeEach(() => {
      gameLoopManager.register('test-task', mockCallback, 1000);
    });

    it('should enable/disable tasks', () => {
      gameLoopManager.setEnabled('test-task', false);
      const task = gameLoopManager.getTaskInfo('test-task');
      expect(task?.enabled).toBe(false);

      gameLoopManager.setEnabled('test-task', true);
      expect(task?.enabled).toBe(true);
    });

    it('should update task interval', () => {
      gameLoopManager.setInterval('test-task', 2000);
      const task = gameLoopManager.getTaskInfo('test-task');
      expect(task?.interval).toBe(2000);
    });
  });

  describe('Loop Execution', () => {
    it('should execute callbacks at correct intervals', async () => {
      let currentTime = 0;
      mockPerformanceNow.mockImplementation(() => currentTime);

      // Register task with 100ms interval
      gameLoopManager.register('test-task', mockCallback, 100);

      // Get the loop callback
      const loopCallback = mockRequestAnimationFrame.mock.calls[0][0];

      // Simulate first frame at time 100ms (task should trigger immediately since lastUpdate starts at 0)
      currentTime = 100;
      loopCallback();

      expect(mockCallback).toHaveBeenCalledWith(0.1, 100); // deltaTime in seconds

      // Simulate frame after 50ms more (total 150ms, should not trigger again)
      currentTime = 150;
      mockCallback.mockClear();
      loopCallback();
      expect(mockCallback).not.toHaveBeenCalled();

      // Simulate frame after 100ms more (total 200ms, should trigger)
      currentTime = 200;
      mockCallback.mockClear();
      loopCallback();
      expect(mockCallback).toHaveBeenCalledWith(0.1, 200); // deltaTime in seconds
    });

    it('should not execute disabled tasks', async () => {
      gameLoopManager.register('test-task', mockCallback, 100);
      gameLoopManager.setEnabled('test-task', false);

      const currentTime = 100;
      mockPerformanceNow.mockImplementation(() => currentTime);

      const loopCallback = mockRequestAnimationFrame.mock.calls[0][0];
      loopCallback();

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      gameLoopManager.register('error-task', errorCallback, 100);

      const currentTime = 100;
      mockPerformanceNow.mockImplementation(() => currentTime);

      const loopCallback = mockRequestAnimationFrame.mock.calls[0][0];
      
      expect(() => loopCallback()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Game loop task error-task error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Manual Control', () => {
    it('should start and stop the loop manually', () => {
      gameLoopManager.start();
      expect(mockRequestAnimationFrame).toHaveBeenCalled();

      gameLoopManager.stop();
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('should not start multiple times', () => {
      gameLoopManager.start();
      mockRequestAnimationFrame.mockClear();
      
      gameLoopManager.start();
      expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe('Task Information', () => {
    it('should return all tasks', () => {
      gameLoopManager.register('task1', mockCallback, 1000);
      gameLoopManager.register('task2', vi.fn(), 500);

      const allTasks = gameLoopManager.getAllTasks();
      expect(allTasks).toHaveLength(2);
      expect(allTasks.some(task => task.id === 'task1')).toBe(true);
      expect(allTasks.some(task => task.id === 'task2')).toBe(true);
    });

    it('should clear all tasks', () => {
      gameLoopManager.register('task1', mockCallback, 1000);
      gameLoopManager.register('task2', vi.fn(), 500);

      gameLoopManager.clear();
      
      expect(gameLoopManager.getAllTasks()).toHaveLength(0);
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Delta Time Calculation', () => {
    it('should calculate correct delta time', () => {
      let currentTime = 0;
      mockPerformanceNow.mockImplementation(() => currentTime);

      gameLoopManager.register('test-task', mockCallback, 16); // 60fps

      // Get the loop callback
      const loopCallback = mockRequestAnimationFrame.mock.calls[0][0];

      // First frame at time 16ms (task should trigger since lastUpdate starts at 0)
      currentTime = 16;
      loopCallback();
      
      expect(mockCallback).toHaveBeenCalledWith(0.016, 16);
      mockCallback.mockClear();

      // Second frame at time 32ms (another 16ms later)
      currentTime = 32;
      loopCallback();
      
      expect(mockCallback).toHaveBeenCalledWith(0.016, 32);
    });
  });
});