import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './slices/inventorySlice';
import craftingReducer from './slices/craftingSlice';
import productionReducer from './slices/productionSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    crafting: craftingReducer,
    production: productionReducer,
    ui: uiReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;