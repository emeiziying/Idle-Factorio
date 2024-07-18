import { rational, Rational } from '@/models';
import { ItemRecord } from '@/models/record';
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
    updateProducer(state) {
      //
      // this.addProducerToItem(state, action);
      // addProducerToItem(state, action);
      const { entities, ids } = state;
      ids.forEach((id) => {
        const { producers = {} } = entities[id];
        Object.keys(producers).forEach((producerId) => {
          const producer = producers[producerId];
          const { amount, duration, in: inputs = {}, workingAmount } = producer;
          if (!amount) return;
          const inKeys = Object.keys(inputs);
          if (inKeys.every((e) => inputs[e].gt(rational(0)))) {
            // inputs enough
          } else {
            //
          }
        });
      });
    },
  },
});

export const {
  addItemStock,
  subItemStock,
  addProducerToItem,
  subProducerFromItem,
} = recordsSlice.actions;

export const recordsState = (state: RootState) => state.records;

export const { selectById, selectEntities } = recordsAdapter.getSelectors();

export const getItemRecordById = (id: string) =>
  createSelector(recordsState, (state) => selectById(state, id));
export const getRecordEntities = createSelector(recordsState, selectEntities);

// export const takeItem = (id: string, amount: Rational) => {
//   // const item = useAppSelector(getItemRecordById(id));
// };

export default recordsSlice.reducer;
