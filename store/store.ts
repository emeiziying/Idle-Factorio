import { combineReducers, configureStore } from '@reduxjs/toolkit'
import machinesReducer from './modules/machinesSlice'
import recipesReducer from './modules/recipesSlice'
import settingsReducer from './modules/settingsSlice'
import technologiesReducer from './modules/technologiesSlice'

const rootReducer = combineReducers({
  recipes: recipesReducer,
  technologies: technologiesReducer,
  machines: machinesReducer,
  settings: settingsReducer,
})

export const makeStore = (preloadedState?: RootState) =>
  configureStore({ preloadedState, reducer: rootReducer })

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = AppStore['dispatch']
