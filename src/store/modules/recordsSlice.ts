import { Entities, Rational } from '@/models';
import type { RootState } from '@/store/store';
import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

export interface ItemRecord {
  stock: Rational;
  producers?: Entities<Rational>;
}

export type RecordsState = Entities<ItemRecord>;

export const initialRecordsState: RecordsState = {};

export const recordsSlice = createSlice({
  name: 'records',
  initialState: initialRecordsState,
  reducers: {
    addItemStock: (
      state,
      action: PayloadAction<{ id: string; stock: Rational }>
    ) => {
      const { id, stock } = action.payload;
      if (state[id]) {
        state[id].stock = state[id].stock.add(stock);
      } else {
        state[id] = { stock };
      }
    },
    subItemStock: (
      state,
      action: PayloadAction<{ id: string; stock: Rational }>
    ) => {
      const { id, stock } = action.payload;
      if (state[id]?.stock.gte(stock)) {
        state[id].stock = state[id].stock.sub(stock);
      }
    },
    updateItemStock: (
      state,
      action: PayloadAction<{ id: string; stock: Rational }>
    ) => {
      const { id, stock } = action.payload;
      if (state[id]) {
        state[id].stock = stock;
      } else {
        state[id] = { stock };
      }
    },
    addProducerToItem: (
      state,
      action: PayloadAction<{
        itemId: string;
        producerId: string;
        amount: Rational;
      }>
    ) => {
      const { itemId, producerId, amount } = action.payload;

      if (state[itemId]) {
        const { producers } = state[itemId];
        if (producers) {
          producers[producerId] = producers[producerId]?.add(amount) ?? amount;
        } else {
          state[itemId].producers = { [producerId]: amount };
        }
      } else {
        state[itemId] = {
          stock: new Rational(0n),
          producers: { [producerId]: amount },
        };
      }
    },
    subProducerToItem: (
      state,
      action: PayloadAction<{
        itemId: string;
        producerId: string;
        amount: Rational;
      }>
    ) => {
      const { itemId, producerId, amount } = action.payload;

      const stock = state[itemId]?.producers?.[producerId];
      if (stock?.gte(amount)) {
        Object.assign(state[itemId], {
          ...state[itemId],
          producers: {
            ...state[itemId].producers,
            [producerId]: stock.sub(amount),
          },
        });
      }
    },
  },
});

export const {
  addItemStock,
  subItemStock,
  updateItemStock,
  addProducerToItem,
  subProducerToItem,
} = recordsSlice.actions;

export const recordsState = (state: RootState): RecordsState => state.records;

export const getItemRecordById = (id: string) =>
  createSelector(recordsState, (state): ItemRecord | undefined => state[id]);

export default recordsSlice.reducer;
