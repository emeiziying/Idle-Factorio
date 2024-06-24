import {
  Game,
  type AppData,
  type Entities,
  type IdValuePayload,
  type Mod,
  type ModData,
  type ModHash,
  type ModI18n,
  type ModInfo,
} from '@/models';
import type { RootState } from '@/store/store';
import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

export interface DatasetPayload {
  data: IdValuePayload<ModData> | null;
  hash: IdValuePayload<ModHash> | null;
  i18n: IdValuePayload<ModI18n> | null;
}

export interface DatasetsState extends AppData {
  dataRecord: Entities<ModData | undefined>;
  hashRecord: Entities<ModHash | undefined>;
  i18nRecord: Entities<ModI18n | undefined>;
}

export const initialDatasetsState: DatasetsState = {
  mods: [{ id: '1.1', name: '1.1.x', game: Game.Factorio }],
  v0: ['1.1'],
  hash: ['1.1'],
  dataRecord: {},
  hashRecord: {},
  i18nRecord: {},
};

export const datasetsSlice = createSlice({
  name: 'datasets',
  initialState: initialDatasetsState,
  reducers: {
    loadMod: (state, action: PayloadAction<DatasetPayload>) => {
      const { data, hash, i18n } = action.payload;

      Object.assign(state, {
        dataRecord: data
          ? { ...state.dataRecord, ...{ [data.id]: data.value } }
          : state.dataRecord,
        hashRecord: hash
          ? { ...state.hashRecord, ...{ [hash.id]: hash.value } }
          : state.hashRecord,
        i18nRecord: i18n
          ? { ...state.i18nRecord, ...{ [i18n.id]: i18n.value } }
          : state.i18nRecord,
      });
    },
  },
});

export const { loadMod } = datasetsSlice.actions;

/* Base selector functions */
export const datasetsState = (state: RootState): DatasetsState =>
  state.datasets;

export const getModSets = createSelector(datasetsState, (state) => state.mods);
export const getDataRecord = createSelector(
  datasetsState,
  (state) => state.dataRecord
);
export const getI18nRecord = createSelector(
  datasetsState,
  (state) => state.i18nRecord
);
export const getHashRecord = createSelector(
  datasetsState,
  (state) => state.hashRecord
);

/* Complex selectors */
export const getModInfoRecord = createSelector(getModSets, (mods) =>
  mods.reduce((e: Entities<ModInfo | undefined>, m) => {
    e[m.id] = m;
    return e;
  }, {})
);

export const getModRecord = createSelector(
  [getModSets, getDataRecord],
  (mods, entities) =>
    mods.reduce((e: Entities<Mod | undefined>, m) => {
      const data = entities[m.id];
      if (data != null) {
        e[m.id] = { ...m, ...data };
      }
      return e;
    }, {})
);

export default datasetsSlice.reducer;
