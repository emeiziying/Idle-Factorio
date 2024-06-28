import { coalesce } from '@/helpers';
import { rational, type Entities, type RecipeSettings } from '@/models';
import { getItemsState } from '@/store/modules/itemsSlice';
import { getMachinesState } from '@/store/modules/machinesSlice';
import {
  getAdjustmentData,
  getAvailableRecipes,
  getCosts,
  getDataset,
} from '@/store/modules/settingsSlice';
import type { RootState } from '@/store/store';
import { RecipeUtility } from '@/utilities';
import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

export type RecipesState = Entities<RecipeSettings>;

export const initialRecipesState: RecipesState = {};

export const recipesSlice = createSlice({
  name: 'recipes',
  initialState: initialRecipesState,
  reducers: {
    load(state, action: PayloadAction<RecipesState>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { load } = recipesSlice.actions;

/* Base selector functions */
export const recipesState = (state: RootState): RecipesState => state.recipes;

/* Complex selectors */
export const getRecipesState = createSelector(
  [recipesState, getMachinesState, getDataset],
  (state, machinesState, data) => {
    const value: Entities<RecipeSettings> = {};
    const defaultExcludedRecipeIds = new Set(
      coalesce(data.defaults?.excludedRecipeIds, [])
    );

    for (const recipe of data.recipeIds.map((i) => data.recipeEntities[i])) {
      const s: RecipeSettings = { ...state[recipe.id] };

      if (s.excluded == null)
        s.excluded = defaultExcludedRecipeIds.has(recipe.id);

      if (s.machineId == null)
        s.machineId = RecipeUtility.bestMatch(
          recipe.producers,
          machinesState.ids
        );

      const machine = data.machineEntities[s.machineId];
      const def = machinesState.entities[s.machineId];

      if (recipe.isBurn) {
        s.fuelId = Object.keys(recipe.in)[0];
      } else {
        s.fuelId = s.fuelId ?? def?.fuelId;
      }

      s.fuelOptions = def?.fuelOptions;

      if (machine != null && RecipeUtility.allowsModules(recipe, machine)) {
        s.moduleOptions = RecipeUtility.moduleOptions(machine, recipe.id, data);

        if (s.moduleIds == null)
          s.moduleIds = RecipeUtility.defaultModules(
            s.moduleOptions,
            coalesce(def.moduleRankIds, []),
            machine.modules ?? rational(0n)
          );

        if (s.beacons == null) s.beacons = [{}];

        s.beacons = s.beacons.map((b) => ({ ...b }));

        for (const beaconSettings of s.beacons) {
          beaconSettings.count = beaconSettings.count ?? def.beaconCount;
          beaconSettings.id = beaconSettings.id ?? def.beaconId;

          if (beaconSettings.id != null) {
            const beacon = data.beaconEntities[beaconSettings.id];
            beaconSettings.moduleOptions = RecipeUtility.moduleOptions(
              beacon,
              recipe.id,
              data
            );

            if (beaconSettings.moduleIds == null)
              beaconSettings.moduleIds = RecipeUtility.defaultModules(
                beaconSettings.moduleOptions,
                coalesce(def.beaconModuleRankIds, []),
                beacon.modules
              );
          }
        }
      } else {
        // Machine doesn't support modules, remove any
        delete s.moduleIds;
        delete s.beacons;
      }

      if (s.beacons) {
        for (const beaconSettings of s.beacons) {
          if (
            beaconSettings.total != null &&
            (beaconSettings.count == null || beaconSettings.count.isZero())
          )
            // No actual beacons, ignore the total beacons
            delete beaconSettings.total;
        }
      }

      s.overclock = s.overclock ?? def?.overclock;

      value[recipe.id] = s;
    }

    return value;
  }
);

export const getExcludedRecipeIds = createSelector(
  getRecipesState,
  (recipesState) =>
    Object.keys(recipesState).filter((i) => recipesState[i].excluded)
);

export const getAdjustedDataset = createSelector(
  [
    getRecipesState,
    getExcludedRecipeIds,
    getItemsState,
    getAvailableRecipes,
    getCosts,
    getAdjustmentData,
    getDataset,
  ],
  (
    recipesState,
    excludedRecipeIds,
    itemsState,
    recipeIds,
    costs,
    adjustmentData,
    data
  ) =>
    RecipeUtility.adjustDataset(
      recipeIds,
      excludedRecipeIds,
      recipesState,
      itemsState,
      adjustmentData,
      costs,
      data
    )
);

export default recipesSlice.reducer;
