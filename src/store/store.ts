import { Rational } from '@/models';
import {
  Tuple,
  combineReducers,
  configureStore,
  createSerializableStateInvariantMiddleware,
  isPlain,
} from '@reduxjs/toolkit';
import { isCollection } from 'immutable';
import datasetsReducer from './modules/datasetsSlice';
import itemsReducer from './modules/itemsSlice';
import machinesReducer from './modules/machinesSlice';
import objectivesReducer from './modules/objectivesSlice';
import preferencesReducer from './modules/preferencesSlice';
import recipesReducer from './modules/recipesSlice';
import recordsReducer from './modules/recordsSlice';
import settingsReducer from './modules/settingsSlice';

const isSerializable = (value: unknown) =>
  isCollection(value) ||
  isPlain(value) ||
  value instanceof Rational ||
  typeof value === 'bigint';

const serializableMiddleware = createSerializableStateInvariantMiddleware({
  isSerializable,
});

const rootReducer = combineReducers({
  recipes: recipesReducer,
  machines: machinesReducer,
  settings: settingsReducer,
  items: itemsReducer,
  datasets: datasetsReducer,
  preferences: preferencesReducer,
  objectives: objectivesReducer,
  records: recordsReducer,
});

export const makeStore = (preloadedState?: RootState) =>
  configureStore({
    preloadedState,
    reducer: rootReducer,
    middleware: () => new Tuple(serializableMiddleware),
  });

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore['dispatch'];
