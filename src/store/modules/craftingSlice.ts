import { Rational } from '@/models';
import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface ManualQueueItem {
  id: string;
  amount: Rational;
}

export interface CraftingState {
  manualQueue: ManualQueueItem[];
}

export const initialCraftingState: CraftingState = {
  manualQueue: [],
};

export const craftingSlice = createSlice({
  name: 'crafting',
  initialState: initialCraftingState,
  reducers: {
    addToQueue: (state, action: PayloadAction<ManualQueueItem[]>) => {
      const { payload } = action;
      const lastOne = state.manualQueue.at(-1);
      if (lastOne?.id === payload[0].id) {
        lastOne.amount = lastOne.amount.add(payload[0].amount);
      } else {
        state.manualQueue.push(...payload);
      }
    },
  },
});

export const { addToQueue } = craftingSlice.actions;

export const craftingState = (state: RootState) => state.crafting;

export const manualQueue = createSelector(
  craftingState,
  (state) => state.manualQueue
);

export default craftingSlice.reducer;
