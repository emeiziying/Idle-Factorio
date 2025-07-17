import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CraftingQueueItem } from '../../types';

interface CraftingState {
  queue: CraftingQueueItem[];
  activeSlot: number;
  maxSlots: number;
  nextId: number;
}

const initialState: CraftingState = {
  queue: [],
  activeSlot: 0,
  maxSlots: 5,
  nextId: 1
};

const craftingSlice = createSlice({
  name: 'crafting',
  initialState,
  reducers: {
    addToQueue: (state, action: PayloadAction<{
      recipeId: string;
      quantity: number;
    }>) => {
      const { recipeId, quantity } = action.payload;
      
      if (state.queue.length < state.maxSlots) {
        state.queue.push({
          id: `craft-${state.nextId}`,
          recipeId,
          quantity,
          startTime: 0,
          progress: 0,
          status: 'waiting'
        });
        state.nextId++;
      }
    },
    
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter(item => item.id !== action.payload);
    },
    
    updateProgress: (state, action: PayloadAction<{
      id: string;
      progress: number;
    }>) => {
      const { id, progress } = action.payload;
      const item = state.queue.find(item => item.id === id);
      if (item) {
        item.progress = progress;
        if (progress >= 100) {
          item.status = 'completed';
        } else if (progress > 0) {
          item.status = 'crafting';
        }
      }
    },
    
    startCrafting: (state, action: PayloadAction<string>) => {
      const item = state.queue.find(item => item.id === action.payload);
      if (item && item.status === 'waiting') {
        item.status = 'crafting';
        item.startTime = Date.now();
      }
    },
    
    completeCrafting: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter(item => item.id !== action.payload);
    },
    
    reorderQueue: (state, action: PayloadAction<{
      fromIndex: number;
      toIndex: number;
    }>) => {
      const { fromIndex, toIndex } = action.payload;
      const [removed] = state.queue.splice(fromIndex, 1);
      state.queue.splice(toIndex, 0, removed);
    }
  }
});

export const {
  addToQueue,
  removeFromQueue,
  updateProgress,
  startCrafting,
  completeCrafting,
  reorderQueue
} = craftingSlice.actions;

export default craftingSlice.reducer;