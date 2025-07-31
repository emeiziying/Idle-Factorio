/**
 * HMR (Hot Module Replacement) 工具类
 * 提供通用的 HMR 功能，简化模块的热重载实现
 */

export interface HMROptions {
  /** 模块名称，用于日志输出 */
  moduleName: string;
  /** 是否在 accept 时自动恢复状态 */
  autoRestore?: boolean;
}

export interface HMRHandlers<T = any> {
  /** 获取需要保存的状态 */
  getState?: () => T;
  /** 恢复状态的处理函数 */
  restoreState?: (state: T) => void;
  /** dispose 时的额外清理函数 */
  onDispose?: () => void;
  /** accept 时的额外处理函数 */
  onAccept?: () => void;
}

/**
 * 为模块设置 HMR 支持
 * @param options HMR 配置选项
 * @param handlers 状态处理函数
 */
export function setupHMR<T = any>(
  options: HMROptions,
  handlers: HMRHandlers<T>
): void {
  if (!import.meta.hot) return;

  const { moduleName, autoRestore = true } = options;
  const stateKey = `${moduleName}_state`;

  // Dispose 阶段：保存状态和清理
  import.meta.hot.dispose(() => {
    try {
      // 保存状态
      if (handlers.getState) {
        const state = handlers.getState();
        import.meta.hot!.data[stateKey] = state;
        console.log(`[HMR] ${moduleName}: Saved state`, state);
      }

      // 执行额外的清理
      if (handlers.onDispose) {
        handlers.onDispose();
        console.log(`[HMR] ${moduleName}: Cleanup completed`);
      }
    } catch (error) {
      console.error(`[HMR] ${moduleName}: Error during dispose`, error);
    }
  });

  // Accept 阶段：恢复状态
  import.meta.hot.accept(() => {
    try {
      console.log(`[HMR] ${moduleName}: Module accepted`);

      // 自动恢复状态
      if (autoRestore && handlers.restoreState && import.meta.hot!.data[stateKey]) {
        const savedState = import.meta.hot!.data[stateKey];
        handlers.restoreState(savedState);
        console.log(`[HMR] ${moduleName}: Restored state`, savedState);
      }

      // 执行额外的处理
      if (handlers.onAccept) {
        handlers.onAccept();
      }
    } catch (error) {
      console.error(`[HMR] ${moduleName}: Error during accept`, error);
    }
  });
}

/**
 * 为单例类设置 HMR 支持
 * 专门处理单例模式的特殊需求
 */
export interface SingletonHMROptions extends HMROptions {
  /** 获取单例实例的函数 */
  getInstance: () => any;
  /** 需要保存的实例属性名称列表 */
  preserveProperties?: string[];
}

export function setupSingletonHMR(options: SingletonHMROptions): void {
  const { getInstance, preserveProperties = [], ...baseOptions } = options;

  setupHMR(baseOptions, {
    getState: () => {
      const instance = getInstance();
      if (!instance || preserveProperties.length === 0) return null;

      // 保存指定的属性
      const state: Record<string, any> = {};
      preserveProperties.forEach(prop => {
        if (prop in instance) {
          state[prop] = instance[prop];
        }
      });
      return state;
    },
    restoreState: (state) => {
      if (!state) return;
      
      const instance = getInstance();
      if (!instance) return;

      // 恢复保存的属性
      Object.entries(state).forEach(([prop, value]) => {
        instance[prop] = value;
      });
    }
  });
}

/**
 * 为游戏循环设置 HMR 支持
 * 提供专门的游戏循环处理逻辑
 */
export interface GameLoopHMROptions extends HMROptions {
  /** 检查循环是否运行的函数 */
  isRunning: () => boolean;
  /** 启动循环的函数 */
  start: () => void;
  /** 停止循环的函数 */
  stop: () => void;
  /** 需要保存的额外状态 */
  getExtraState?: () => any;
  /** 恢复额外状态的函数 */
  restoreExtraState?: (state: any) => void;
}

export function setupGameLoopHMR(options: GameLoopHMROptions): void {
  const { 
    isRunning, 
    start, 
    stop, 
    getExtraState, 
    restoreExtraState,
    ...baseOptions 
  } = options;

  setupHMR(baseOptions, {
    getState: () => ({
      wasRunning: isRunning(),
      extraState: getExtraState?.()
    }),
    onDispose: () => {
      if (isRunning()) {
        stop();
      }
    },
    restoreState: (state) => {
      // 恢复额外状态
      if (state.extraState && restoreExtraState) {
        restoreExtraState(state.extraState);
      }
      
      // 如果之前在运行，重新启动
      if (state.wasRunning) {
        start();
      }
    }
  });
}

/**
 * React 组件 HMR 辅助 Hook
 * 用于在组件中处理 HMR 相关的清理
 */
export function useHMRCleanup(cleanup: () => void, deps: React.DependencyList = []): void {
  if (import.meta.hot) {
    // 使用 useEffect 确保在组件卸载时执行清理
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      return () => {
        if (import.meta.hot) {
          cleanup();
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
  }
}

// 导入 React（仅在需要时）
import * as React from 'react';