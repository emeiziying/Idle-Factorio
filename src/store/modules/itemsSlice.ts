import { ItemId, type Entities, type ItemSettings } from '@/models'
import { getDataset, getSettings } from '@/store/modules/settingsSlice'
import type { RootState } from '@/store/store'
import { createSelector, createSlice } from '@reduxjs/toolkit'

export type ItemsState = Entities<ItemSettings>

export const initialItemsState: ItemsState = {}

export const itemsSlice = createSlice({
  name: 'items',
  initialState: initialItemsState,
  reducers: {},
})

/* Base selector functions */
export const itemsState = (state: RootState): ItemsState => state.items

/* Complex selectors */
export const getItemsState = createSelector(
  [itemsState, getDataset, getSettings],
  (state, data, settings) => {
    const value: Entities<ItemSettings> = {}
    if (data?.itemIds?.length) {
      for (const item of data.itemIds.map((i) => data.itemEntities[i])) {
        const itemSettings: ItemSettings = state[item.id]
          ? { ...state[item.id] }
          : { excluded: false }

        // Belt (or Pipe)
        if (!itemSettings.beltId) {
          if (item.stack) {
            itemSettings.beltId = settings.beltId
          } else if (settings.pipeId) {
            itemSettings.beltId = settings.pipeId
          } else {
            itemSettings.beltId = ItemId.Pipe
          }
        }

        if (!itemSettings.wagonId) {
          itemSettings.wagonId = item.stack
            ? settings.cargoWagonId
            : settings.fluidWagonId
        }

        value[item.id] = itemSettings
      }
    }
    return value
  },
)

export const getItemsModified = createSelector(itemsState, (state) => ({
  excluded: Object.keys(state).some((id) => state[id].excluded != null),
  checked: Object.keys(state).some((id) => state[id].checked != null),
  belts: Object.keys(state).some((id) => state[id].beltId != null),
  wagons: Object.keys(state).some((id) => state[id].wagonId != null),
}))

export const getExcludedItemIds = createSelector(getItemsState, (itemsState) =>
  Object.keys(itemsState).filter((i) => itemsState[i]?.excluded),
)

export default itemsSlice.reducer
