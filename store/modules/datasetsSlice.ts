import { data } from '@/data'
import type {
  AppData,
  Entities,
  Mod,
  ModData,
  ModHash,
  ModI18n,
  ModInfo,
} from '@/models'
import type { RootState } from '@/store/store'
import { createSelector, createSlice } from '@reduxjs/toolkit'

export interface DatasetsState extends AppData {
  dataRecord: Entities<ModData | undefined>
  hashRecord: Entities<ModHash | undefined>
  i18nRecord: Entities<ModI18n | undefined>
}

export const initialDatasetsState: DatasetsState = {
  ...data,
  dataRecord: {},
  hashRecord: {},
  i18nRecord: {},
}

export const datasetsSlice = createSlice({
  name: 'datasets',
  initialState: initialDatasetsState,
  reducers: {},
})

/* Base selector functions */
export const datasetsState = (state: RootState): DatasetsState => state.datasets

export const getModSets = createSelector(datasetsState, (state) => state.mods)
export const getDataRecord = createSelector(
  datasetsState,
  (state) => state.dataRecord,
)
export const getI18nRecord = createSelector(
  datasetsState,
  (state) => state.i18nRecord,
)
export const getHashRecord = createSelector(
  datasetsState,
  (state) => state.hashRecord,
)

/* Complex selectors */
export const getModInfoRecord = createSelector(getModSets, (mods) =>
  mods.reduce((e: Entities<ModInfo | undefined>, m) => {
    e[m.id] = m
    return e
  }, {}),
)

export const getModRecord = createSelector(
  [getModSets, getDataRecord],
  (mods, entities) =>
    mods.reduce((e: Entities<Mod | undefined>, m) => {
      const data = entities[m.id]
      if (data != null) {
        e[m.id] = { ...m, ...data }
      }
      return e
    }, {}),
)

export default datasetsSlice.reducer
