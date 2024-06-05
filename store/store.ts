import { combineReducers, configureStore } from '@reduxjs/toolkit'
import datasetsReducer from './modules/datasetsSlice'
import itemsReducer from './modules/itemsSlice'
import machinesReducer from './modules/machinesSlice'
import preferencesReducer from './modules/preferencesSlice'
import recipesReducer from './modules/recipesSlice'
import settingsReducer from './modules/settingsSlice'
import technologiesReducer from './modules/technologiesSlice'

const rootReducer = combineReducers({
  recipes: recipesReducer,
  technologies: technologiesReducer,
  machines: machinesReducer,
  settings: settingsReducer,
  items: itemsReducer,
  datasets: datasetsReducer,
  preferences: preferencesReducer,
})

export const makeStore = (preloadedState?: RootState) =>
  configureStore({ preloadedState, reducer: rootReducer })

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = AppStore['dispatch']
