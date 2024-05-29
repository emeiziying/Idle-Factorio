import { combineReducers, configureStore } from '@reduxjs/toolkit'
import technologiesReducer from './modules/technologiesSlice'

const rootReducer = combineReducers({
  technologies: technologiesReducer,
})

export const makeStore = (preloadedState?: RootState) =>
  configureStore({ preloadedState, reducer: rootReducer })

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = AppStore['dispatch']
