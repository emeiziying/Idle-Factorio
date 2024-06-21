import {
  FlowDiagram,
  Game,
  Language,
  PowerUnit,
  SankeyAlign,
  Theme,
  initialColumnsState,
  type ColumnsState,
  type Entities,
} from '@/models';
import type { RootState } from '@/store/store';
import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

export interface PreferencesState {
  states: Record<Game, Entities<string>>;
  columns: ColumnsState;
  language: Language;
  powerUnit: PowerUnit;
  theme: Theme;
  bypassLanding: boolean;
  showTechLabels: boolean;
  hideDuplicateIcons: boolean;
  rows: number;
  disablePaginator: boolean;
  paused: boolean;
  flowDiagram: FlowDiagram;
  sankeyAlign: SankeyAlign;
  flowHideExcluded: boolean;
}

export const initialPreferencesState: PreferencesState = {
  states: {
    [Game.Factorio]: {},
    [Game.DysonSphereProgram]: {},
    [Game.Satisfactory]: {},
    [Game.CaptainOfIndustry]: {},
    [Game.Techtonica]: {},
    [Game.FinalFactory]: {},
  },
  columns: initialColumnsState,
  language: Language.English,
  powerUnit: PowerUnit.Auto,
  theme: Theme.Dark,
  bypassLanding: false,
  showTechLabels: false,
  hideDuplicateIcons: false,
  rows: 50,
  disablePaginator: false,
  paused: false,
  flowDiagram: FlowDiagram.Sankey,
  sankeyAlign: SankeyAlign.Justify,
  flowHideExcluded: false,
};

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: initialPreferencesState,
  reducers: {
    SET_LANGUAGE: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
  },
});

export const { SET_LANGUAGE } = preferencesSlice.actions;

/* Base selector functions */
export const preferencesState = (state: RootState): PreferencesState =>
  state.preferences;

export const getStates = createSelector(
  preferencesState,
  (state) => state.states
);
export const getColumns = createSelector(
  preferencesState,
  (state) => state.columns
);
export const getPowerUnit = createSelector(
  preferencesState,
  (state) => state.powerUnit
);
export const getLanguage = createSelector(
  preferencesState,
  (state) => state.language
);
export const getTheme = createSelector(
  preferencesState,
  (state) => state.theme
);
export const getBypassLanding = createSelector(
  preferencesState,
  (state) => state.bypassLanding
);
export const getShowTechLabels = createSelector(
  preferencesState,
  (state) => state.showTechLabels
);
export const getPaused = createSelector(
  preferencesState,
  (state) => state.paused
);

export default preferencesSlice.reducer;
