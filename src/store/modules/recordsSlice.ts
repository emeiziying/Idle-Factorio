import { rational, Rational } from '@/models';
import { ItemProducerIn, ItemRecord } from '@/models/record';
import type { RootState } from '@/store/store';
import {
  createEntityAdapter,
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

const recordsAdapter = createEntityAdapter<ItemRecord>();

export const recordsSlice = createSlice({
  name: 'records',
  initialState: recordsAdapter.getInitialState(),
  reducers: {
    addItemStock: (
      state,
      action: PayloadAction<{ id: string; amount: Rational }>
    ) => {
      const { id, amount } = action.payload;
      const { stock = rational(0) } = state.entities[id] || {};
      recordsAdapter.upsertOne(state, { id, stock: stock.add(amount) });
    },
    subItemStock: (
      state,
      action: PayloadAction<{ id: string; amount: Rational }>
    ) => {
      const { id, amount } = action.payload;
      const { stock } = state.entities[id];
      const result = stock.gte(amount) ? stock.sub(amount) : rational(0);
      recordsAdapter.updateOne(state, { id, changes: { stock: result } });
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
      const { producers } = state.entities[itemId] || {};
      const result = producers?.producerId.amount.add(amount) ?? amount;
      recordsAdapter.upsertOne(state, {
        id: itemId,
        stock: rational(0),
        producers: { ...producers, [producerId]: { amount: result } },
      });
    },
    subProducerFromItem: (
      state,
      action: PayloadAction<{
        itemId: string;
        producerId: string;
        amount: Rational;
      }>
    ) => {
      const { itemId, producerId, amount } = action.payload;
      const { producers } = state.entities[itemId];
      const result = producers?.producerId?.amount.gte(amount)
        ? producers.productId.amount.sub(amount)
        : rational(0);
      recordsAdapter.updateOne(state, {
        id: itemId,
        changes: {
          producers: { ...producers, [producerId]: { amount: result } },
        },
      });
    },
    updateProducerInItem: (
      state,
      action: PayloadAction<{
        itemId: string;
        producerId: string;
        inId: string;
        data: ItemProducerIn;
      }>
    ) => {
      const { itemId, producerId, inId, data } = action.payload;
      const { producers } = state.entities[itemId];

      recordsAdapter.updateOne(state, {
        id: itemId,
        changes: {
          producers: {
            ...producers,
            [producerId]: {
              ...producers?.[producerId],
              amount: rational(1),
              in: {
                ...producers?.[producerId].in,
                [inId]: data,
              },
            },
          },
        },
      });
    },
  },
});

export const {
  addItemStock,
  subItemStock,
  addProducerToItem,
  subProducerFromItem,
  updateProducerInItem,
} = recordsSlice.actions;

export const recordsState = (state: RootState) => state.records;

export const { selectById, selectEntities: selectItemRecordEntities } =
  recordsAdapter.getSelectors(recordsState);

export const selectProducerFromRecordById = createSelector(
  (_: unknown, data: { itemId: string; machineId: string }) => data.machineId,
  (state: RootState, data: { itemId: string; machineId: string }) =>
    selectById(state, data.itemId),
  (machineId, itemRecord) => itemRecord?.producers?.[machineId]
);

export const selectStockFromRecordById = createSelector(
  (state: RootState, id: string) => selectById(state, id),
  (itemRecord): Rational | undefined => itemRecord?.stock
);

export default recordsSlice.reducer;
