import React, {createContext, useContext, useReducer, useEffect} from 'react';
import {GameState, CraftingTask, InventoryLimit} from '../types';
import {initialGameState, items, recipes, storageDevices} from '../data/gameData';

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  addToCraftingQueue: (itemId: string, quantity: number) => void;
  removeFromCraftingQueue: (taskId: string) => void;
  addStorageDevice: (itemId: string, deviceType: string) => boolean;
  removeStorageDevice: (itemId: string, deviceIndex: number) => boolean;
  getInventoryLimit: (itemId: string) => InventoryLimit;
}

type GameAction =
  | {type: 'UPDATE_RESOURCE'; itemId: string; amount: number}
  | {type: 'ADD_CRAFTING_TASK'; task: CraftingTask}
  | {type: 'REMOVE_CRAFTING_TASK'; taskId: string}
  | {type: 'UPDATE_CRAFTING_PROGRESS'; taskId: string; progress: number}
  | {type: 'SET_SELECTED_CATEGORY'; category: string}
  | {type: 'ADD_STORAGE_DEVICE'; itemId: string; deviceType: string}
  | {type: 'REMOVE_STORAGE_DEVICE'; itemId: string; deviceIndex: number};

const GameContext = createContext<GameContextType | undefined>(undefined);

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: {
          ...state.resources,
          [action.itemId]: Math.max(0, (state.resources[action.itemId] || 0) + action.amount),
        },
      };

    case 'ADD_CRAFTING_TASK':
      return {
        ...state,
        craftingQueue: [...state.craftingQueue, action.task],
      };

    case 'REMOVE_CRAFTING_TASK':
      return {
        ...state,
        craftingQueue: state.craftingQueue.filter(task => task.id !== action.taskId),
      };

    case 'UPDATE_CRAFTING_PROGRESS':
      return {
        ...state,
        craftingQueue: state.craftingQueue.map(task =>
          task.id === action.taskId
            ? {...task, progress: action.progress}
            : task,
        ),
      };

    case 'SET_SELECTED_CATEGORY':
      return {
        ...state,
        selectedCategory: action.category,
      };

    case 'ADD_STORAGE_DEVICE':
      const device = storageDevices[action.deviceType];
      if (!device) return state;

      // 检查是否有足够的存储设备库存
      if ((state.resources[action.deviceType] || 0) <= 0) {
        return state;
      }

      // 消耗存储设备库存
      return {
        ...state,
        resources: {
          ...state.resources,
          [action.deviceType]: Math.max(0, (state.resources[action.deviceType] || 0) - 1),
        },
      };

    case 'REMOVE_STORAGE_DEVICE':
      return state; // 简化实现，实际需要更复杂的逻辑

    default:
      return state;
  }
};

export const GameProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  // 游戏循环 - 更新制作进度
  useEffect(() => {
    const interval = setInterval(() => {
      state.craftingQueue.forEach(task => {
        const recipe = recipes[task.itemId];
        if (!recipe) return;

        const progressPerSecond = 1 / recipe.time;
        const newProgress = task.progress + progressPerSecond * 0.1; // 100ms更新

        if (newProgress >= 1) {
          // 任务完成
          dispatch({
            type: 'UPDATE_RESOURCE',
            itemId: task.itemId,
            amount: recipe.out[task.itemId] || 1,
          });
          dispatch({type: 'REMOVE_CRAFTING_TASK', taskId: task.id});
        } else {
          // 更新进度
          dispatch({
            type: 'UPDATE_CRAFTING_PROGRESS',
            taskId: task.id,
            progress: newProgress,
          });
        }
      });
    }, 100);

    return () => clearInterval(interval);
  }, [state.craftingQueue]);

  const addToCraftingQueue = (itemId: string, quantity: number) => {
    const recipe = recipes[itemId];
    if (!recipe) return;

    const task: CraftingTask = {
      id: Date.now().toString(),
      type: recipe.isMining ? 'mining' : 'crafting',
      itemId,
      quantity,
      progress: 0,
      totalTime: recipe.time,
      createdAt: Date.now(),
    };

    dispatch({type: 'ADD_CRAFTING_TASK', task});
  };

  const removeFromCraftingQueue = (taskId: string) => {
    dispatch({type: 'REMOVE_CRAFTING_TASK', taskId});
  };

  const addStorageDevice = (itemId: string, deviceType: string): boolean => {
    const device = storageDevices[deviceType];
    if (!device) return false;

    // 检查是否有足够的存储设备库存
    if ((state.resources[deviceType] || 0) <= 0) {
      return false;
    }

    dispatch({type: 'ADD_STORAGE_DEVICE', itemId, deviceType});
    return true;
  };

  const removeStorageDevice = (itemId: string, deviceIndex: number): boolean => {
    dispatch({type: 'REMOVE_STORAGE_DEVICE', itemId, deviceIndex});
    return true;
  };

  const getInventoryLimit = (itemId: string): InventoryLimit => {
    // 简化实现，实际需要更复杂的逻辑
    const currentAmount = state.resources[itemId] || 0;
    const maxCapacity = 100; // 基础容量
    return {
      itemId,
      currentAmount,
      maxCapacity,
      storageDevices: [],
      isFull: currentAmount >= maxCapacity,
    };
  };

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        addToCraftingQueue,
        removeFromCraftingQueue,
        addStorageDevice,
        removeStorageDevice,
        getInventoryLimit,
      }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 