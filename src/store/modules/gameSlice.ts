import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface GameState {
  currentCategory: string;
  currentItemId: string;
}

const initialGameState: GameState = {
  currentCategory: '0',
  currentItemId: '',
};

export const gameSlice = createSlice({
  name: 'game',
  initialState: initialGameState,
  reducers: {
    SET_CURRENT_CATEGORY: (state, action: PayloadAction<string>) => {
      state.currentCategory = action.payload;
    },
    SET_CURRENT_ITEM: (state, action: PayloadAction<string>) => {
      state.currentItemId = action.payload;
    },
  },
});

export const { SET_CURRENT_CATEGORY, SET_CURRENT_ITEM } = gameSlice.actions;

export const gameState = (state: RootState) => state.game;

export default gameSlice.reducer;
