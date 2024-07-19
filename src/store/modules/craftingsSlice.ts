import { rational, Rational } from '@/models';
import {
  createEntityAdapter,
  createSlice,
  nanoid,
  PayloadAction,
} from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface ManualQueueItem {
  itemId: string;
  amount: Rational;
  progress?: number;
}

export interface ManualQueueItemEntity extends ManualQueueItem {
  id: string;
}

const craftingsAdapter = createEntityAdapter<ManualQueueItemEntity>();

export const craftingsSlice = createSlice({
  name: 'craftings',
  initialState: craftingsAdapter.getInitialState(),
  reducers: {
    ADD_TO_QUEUE: (state, action: PayloadAction<ManualQueueItem[]>) => {
      const { entities, ids } = state;

      const lastId = ids.at(-1);
      const lastOne = lastId ? entities[lastId] : undefined;

      craftingsAdapter.upsertMany(
        state,
        action.payload.map<ManualQueueItemEntity>((e, i) =>
          i === 0 && lastOne?.itemId === e.itemId
            ? { ...lastOne, amount: lastOne?.amount.add(e.amount) }
            : { ...e, id: nanoid() }
        )
      );
    },
    UPDATE_QUEUE_ITEM: (
      state,
      action: PayloadAction<ManualQueueItemEntity>
    ) => {
      if (action.payload.amount.gt(rational(0))) {
        craftingsAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload,
        });
      } else {
        // remove
        craftingsAdapter.removeOne(state, action.payload.id);
      }
    },
  },
});

export const { ADD_TO_QUEUE, UPDATE_QUEUE_ITEM } = craftingsSlice.actions;

export const craftingsState = (state: RootState) => state.craftings;

export const {
  selectIds: selectCraftingIds,
  selectEntities: selectCraftingEntities,
  selectById: selectCraftingById,
} = craftingsAdapter.getSelectors(craftingsState);

export default craftingsSlice.reducer;
