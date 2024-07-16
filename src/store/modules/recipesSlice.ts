import {
  AdjustedRecipe,
  Item,
  Machine,
  Recipe,
  type Entities,
  type RecipeSettings,
} from '@/models';
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
import { recordsState } from './recordsSlice';

export type RecipesState = Entities<RecipeSettings>;

export const initialRecipesState: RecipesState = {};

export const recipesSlice = createSlice({
  name: 'recipes',
  initialState: initialRecipesState,
  reducers: {
    load(state, action: PayloadAction<RecipesState>) {
      Object.assign(state, action.payload);
    },

    SET_MACHINE(
      state,
      action: PayloadAction<{ recipeId: string; machineId: string }>
    ) {
      const { recipeId, machineId } = action.payload;
      state[recipeId] = { machineId };
    },
  },
});

export const { load, SET_MACHINE } = recipesSlice.actions;

/* Base selector functions */
export const recipesState = (state: RootState): RecipesState => state.recipes;

/* Complex selectors */
export const getRecipesState = createSelector(
  [recipesState, getMachinesState, getDataset],
  (state, machinesState, data) => {
    const value: Entities<RecipeSettings> = {};

    for (const recipe of data.recipeIds.map((i) => data.recipeEntities[i])) {
      value[recipe.id] = RecipeUtility.adjustSettings(
        state,
        machinesState,
        data,
        recipe.id
      );
    }

    return value;
  }
);

export const getRecipeSettingsWithProducer = (
  recipeId: string,
  machineId: string
) =>
  createSelector(
    [recipesState, getMachinesState, getDataset],
    (state, machinesState, data) =>
      RecipeUtility.adjustSettings(
        state,
        machinesState,
        data,
        recipeId,
        machineId
      )
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

export const getRecipeEntities = createSelector(
  getAdjustedDataset,
  (adjustedDataset) => adjustedDataset.recipeEntities
);

export const getItemEntities = createSelector(
  getAdjustedDataset,
  (adjustedDataset) => adjustedDataset.itemEntities
);

export const getTechnologyEntities = createSelector(
  getAdjustedDataset,
  (adjustedDataset) => adjustedDataset.technologyEntities
);

export const getAdjustedRecipeById = (id: string) =>
  createSelector(
    getAdjustedDataset,
    (adjustedDataset): AdjustedRecipe | undefined =>
      adjustedDataset.adjustedRecipe[id]
  );

export const getRecipeEntityById = (id: string) =>
  createSelector(
    getAdjustedDataset,
    (adjustedDataset): Recipe | undefined => adjustedDataset.recipeEntities[id]
  );

export const getItemEntityById = (id: string) =>
  createSelector(
    getAdjustedDataset,
    (adjustedDataset): Item | undefined => adjustedDataset.itemEntities[id]
  );

export const getMachineEntityById = (id: string) =>
  createSelector(
    getAdjustedDataset,
    (adjustedDataset): Machine | undefined =>
      adjustedDataset.machineEntities[id]
  );

export const getItemStatus = (id: string) =>
  createSelector(
    getRecipeEntityById(id),
    recordsState,
    (recipeEntity, records) => {
      const canManualCrafting =
        !!recipeEntity &&
        !['smelting', 'fluids'].includes(recipeEntity.category);

      const canMake =
        !!recipeEntity &&
        Object.keys(recipeEntity.in).every((e) =>
          records.entities[e]?.stock?.gte(recipeEntity.in[e])
        );

      return { canManualCrafting, canMake };
    }
  );

export const getAdjustedRecipeByIdWithProducer = (
  id: string,
  producer: string
) =>
  createSelector(
    getRecipeSettingsWithProducer(id, producer),
    getExcludedRecipeIds,
    getItemsState,
    getAvailableRecipes,
    getCosts,
    getAdjustmentData,
    getDataset,
    (
      settings,
      excludedRecipeIds,
      itemsState,
      recipeIds,
      costs,
      adjustmentData,
      data
    ): AdjustedRecipe | undefined =>
      RecipeUtility.adjustRecipe(id, adjustmentData, settings, itemsState, data)
  );

export default recipesSlice.reducer;
