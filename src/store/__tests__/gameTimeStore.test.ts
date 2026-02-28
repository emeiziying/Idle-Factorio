import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import useGameTimeStore from '@/store/gameTimeStore';

// gameTimeStore 测试套件 - 游戏时间管理
describe('gameTimeStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    // 重置 store 到初始状态
    useGameTimeStore.setState({ gameTime: 0 });
  });

  // 初始状态测试
  describe('initial state', () => {
    // 测试：游戏时间应该初始化为 0
    it('should have gameTime set to 0', () => {
      const state = useGameTimeStore.getState();
      expect(state.gameTime).toBe(0);
    });
  });

  // 设置游戏时间测试
  describe('setGameTime', () => {
    // 测试：应该设置游戏时间为特定值
    it('should set game time to specific value', () => {
      const { setGameTime } = useGameTimeStore.getState();

      act(() => {
        setGameTime(1000);
      });

      expect(useGameTimeStore.getState().gameTime).toBe(1000);
    });

    // 测试：应该覆盖现有的游戏时间
    it('should overwrite existing game time', () => {
      const { setGameTime } = useGameTimeStore.getState();

      act(() => {
        setGameTime(500);
      });
      expect(useGameTimeStore.getState().gameTime).toBe(500);

      act(() => {
        setGameTime(1500);
      });
      expect(useGameTimeStore.getState().gameTime).toBe(1500);
    });

    // 测试：应该处理负值
    it('should handle negative values', () => {
      const { setGameTime } = useGameTimeStore.getState();

      act(() => {
        setGameTime(-100);
      });

      expect(useGameTimeStore.getState().gameTime).toBe(-100);
    });

    // 测试：应该处理零值
    it('should handle zero value', () => {
      const { setGameTime } = useGameTimeStore.getState();

      // First set to non-zero
      // 先设置为非零值
      act(() => {
        setGameTime(1000);
      });

      // Then reset to zero
      // 然后重置为零
      act(() => {
        setGameTime(0);
      });

      expect(useGameTimeStore.getState().gameTime).toBe(0);
    });
  });

  // 增加游戏时间测试
  describe('incrementGameTime', () => {
    // 测试：应该按增量增加游戏时间
    it('should increment game time by delta', () => {
      const { incrementGameTime } = useGameTimeStore.getState();

      act(() => {
        incrementGameTime(100);
      });

      expect(useGameTimeStore.getState().gameTime).toBe(100);
    });

    // 测试：应该累加增量
    it('should accumulate increments', () => {
      const { incrementGameTime } = useGameTimeStore.getState();

      act(() => {
        incrementGameTime(100);
      });
      expect(useGameTimeStore.getState().gameTime).toBe(100);

      act(() => {
        incrementGameTime(50);
      });
      expect(useGameTimeStore.getState().gameTime).toBe(150);

      act(() => {
        incrementGameTime(25);
      });
      expect(useGameTimeStore.getState().gameTime).toBe(175);
    });

    // 测试：应该处理小数增量
    it('should handle decimal increments', () => {
      const { incrementGameTime } = useGameTimeStore.getState();

      act(() => {
        incrementGameTime(0.1);
      });
      expect(useGameTimeStore.getState().gameTime).toBeCloseTo(0.1);

      act(() => {
        incrementGameTime(0.2);
      });
      expect(useGameTimeStore.getState().gameTime).toBeCloseTo(0.3);
    });

    // 测试：应该处理负增量
    it('should handle negative increments', () => {
      const { setGameTime, incrementGameTime } = useGameTimeStore.getState();

      // Start with positive time
      // 从正时间开始
      act(() => {
        setGameTime(1000);
      });

      // Decrement
      // 递减
      act(() => {
        incrementGameTime(-100);
      });

      expect(useGameTimeStore.getState().gameTime).toBe(900);
    });

    // 测试：应该处理大增量
    it('should handle large increments', () => {
      const { incrementGameTime } = useGameTimeStore.getState();

      act(() => {
        incrementGameTime(1000000);
      });

      expect(useGameTimeStore.getState().gameTime).toBe(1000000);
    });
  });

  // 组合操作测试
  describe('combined operations', () => {
    // 测试：setGameTime 后跟 incrementGameTime 应该正常工作
    it('should work with setGameTime followed by incrementGameTime', () => {
      const { setGameTime, incrementGameTime } = useGameTimeStore.getState();

      act(() => {
        setGameTime(500);
      });

      act(() => {
        incrementGameTime(250);
      });

      expect(useGameTimeStore.getState().gameTime).toBe(750);
    });

    // 测试：应该处理多次快速增量
    it('should handle multiple rapid increments', () => {
      const { incrementGameTime } = useGameTimeStore.getState();

      act(() => {
        for (let i = 0; i < 100; i++) {
          incrementGameTime(1);
        }
      });

      expect(useGameTimeStore.getState().gameTime).toBe(100);
    });
  });

  // store 订阅测试
  describe('store subscription', () => {
    // 测试：状态改变时应通知订阅者
    it('should notify subscribers on state changes', () => {
      let notificationCount = 0;
      let lastGameTime = 0;

      const unsubscribe = useGameTimeStore.subscribe(state => {
        notificationCount++;
        lastGameTime = state.gameTime;
      });

      const { setGameTime, incrementGameTime } = useGameTimeStore.getState();

      act(() => {
        setGameTime(100);
      });

      expect(notificationCount).toBe(1);
      expect(lastGameTime).toBe(100);

      act(() => {
        incrementGameTime(50);
      });

      expect(notificationCount).toBe(2);
      expect(lastGameTime).toBe(150);

      unsubscribe();
    });
  });

  // 边界情况测试
  describe('edge cases', () => {
    // 测试：应该处理非常小的增量
    it('should handle very small increments', () => {
      const { incrementGameTime } = useGameTimeStore.getState();

      act(() => {
        incrementGameTime(0.00001);
      });

      expect(useGameTimeStore.getState().gameTime).toBeGreaterThan(0);
    });

    // 测试：应该处理浮点精度
    it('should handle floating point precision', () => {
      const { incrementGameTime } = useGameTimeStore.getState();

      // Known floating point precision issue: 0.1 + 0.2 !== 0.3
      // 已知的浮点精度问题：0.1 + 0.2 !== 0.3
      act(() => {
        incrementGameTime(0.1);
        incrementGameTime(0.2);
      });

      expect(useGameTimeStore.getState().gameTime).toBeCloseTo(0.3, 10);
    });

    // 测试：不应持久化状态（无 localStorage）
    it('should not persist state (no localStorage)', () => {
      const { setGameTime } = useGameTimeStore.getState();

      act(() => {
        setGameTime(12345);
      });

      // Check that nothing is saved to localStorage
      // 检查没有保存到 localStorage
      expect(localStorage.getItem('game-storage')).toBeNull();
    });
  });
});
