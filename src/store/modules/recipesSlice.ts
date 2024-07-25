import {
  AdjustedRecipe,
  Item,
  Machine,
  Rational,
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

export const getRecipeSettingsWithProducer = createSelector(
  (_: unknown, data: { recipeId: string; machineId: string }) => data.recipeId,
  (_: unknown, data: { recipeId: string; machineId: string }) => data.machineId,
  recipesState,
  getMachinesState,
  getDataset,
  (recipeId, machineId, state, machinesState, dataset) =>
    RecipeUtility.adjustSettings(
      state,
      machinesState,
      dataset,
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
  getRecipesState,
  getExcludedRecipeIds,
  getItemsState,
  getAvailableRecipes,
  getCosts,
  getAdjustmentData,
  getDataset,
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

export const selectAdjustedRecipeById = createSelector(
  (_: unknown, id: string) => id,
  getAdjustedDataset,
  (id, adjustedDataset): AdjustedRecipe | undefined =>
    adjustedDataset.adjustedRecipe[id]
);

export const selectRecipeEntityById = createSelector(
  (_: unknown, id: string) => id,
  getAdjustedDataset,
  (id, adjustedDataset): Recipe | undefined =>
    adjustedDataset.recipeEntities[id]
);

export const selectRecipeInById = createSelector(
  (_: unknown, data: { recipeId: string; inId: string }) => data.recipeId,
  (_: unknown, data: { recipeId: string; inId: string }) => data.inId,
  getAdjustedDataset,
  (recipeId, inId, adjustedDataset): Rational | undefined =>
    adjustedDataset.recipeEntities[recipeId]?.in[inId]
);

export const selectItemEntityById = createSelector(
  (_: unknown, id: string) => id,
  getAdjustedDataset,
  (id, adjustedDataset): Item | undefined => adjustedDataset.itemEntities[id]
);

export const selectMachineEntityById = createSelector(
  (_: unknown, id: string) => id,
  getAdjustedDataset,
  (id, adjustedDataset): Machine | undefined =>
    adjustedDataset.machineEntities[id]
);

export const selectItemStatusById = createSelector(
  (_: unknown, id: string) => id,
  getAdjustedDataset,
  recordsState,
  (id, adjustedDataset, records) => {
    const recipeEntity = adjustedDataset.recipeEntities[id];
    const canManualCrafting =
      !!recipeEntity && !['smelting', 'fluids'].includes(recipeEntity.category);

    const canMake =
      !!recipeEntity &&
      Object.keys(recipeEntity.in).every((e) =>
        records.entities[e]?.stock?.gte(recipeEntity.in[e])
      );

    const status = { canManualCrafting, canMake };

    return status;
  }
);

export const selectCanManualCraftingById = createSelector(
  (_: unknown, id: string) => id,
  getAdjustedDataset,
  (id, adjustedDataset) => {
    const recipeEntity = adjustedDataset.recipeEntities[id];
    return (
      !!recipeEntity && !['smelting', 'fluids'].includes(recipeEntity.category)
    );
  }
);

export const selectCanMakeById = createSelector(
  (_: unknown, id: string) => id,
  getAdjustedDataset,
  recordsState,
  (id, adjustedDataset, records) => {
    const recipeEntity = adjustedDataset.recipeEntities[id];

    return (
      !!recipeEntity &&
      Object.keys(recipeEntity.in).every((e) =>
        records.entities[e]?.stock?.gte(recipeEntity.in[e])
      )
    );
  }
);

export const selectAdjustedRecipeByIdWithProducer = createSelector(
  (_: unknown, data: { recipeId: string; machineId: string }) => data.recipeId,
  (state: RootState, data: { recipeId: string; machineId: string }) =>
    getRecipeSettingsWithProducer(state, data),
  getDataset,
  getItemsState,
  getAdjustmentData,
  (
    recipeId,
    settings,
    dataset,
    itemsState,
    adjustmentData
  ): AdjustedRecipe | undefined =>
    RecipeUtility.adjustRecipe(
      recipeId,
      adjustmentData,
      settings,
      itemsState,
      dataset
    )
);

export default recipesSlice.reducer;
