import { Entities, rational, Rational } from '@/models';
import type { RootState } from '@/store/store';
import {
  createEntityAdapter,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

export interface ItemRecord {
  id: string;
  stock: Rational;
  producers?: Entities<Rational>;
}

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
      const { stock = rational(0) } = state.entities[id];
      recordsAdapter.upsertOne(state, { id, stock: stock.add(amount) });
    },
    subItemStock: (
      state,
      action: PayloadAction<{ id: string; amount: Rational }>
    ) => {
      const { id, amount } = action.payload;
      const { stock = rational(0) } = state.entities[id];
      // const result = stock.sub(amount);
      if (stock.gte(amount)) {
        recordsAdapter.updateOne(state, {
          id,
          changes: { stock: stock.sub(amount) },
        });
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

      // if (state[itemId]) {
      //   const { producers } = state[itemId];
      //   if (producers) {
      //     producers[producerId] = producers[producerId]?.add(amount) ?? amount;
      //   } else {
      //     state[itemId].producers = { [producerId]: amount };
      //   }
      // } else {
      //   state[itemId] = {
      //     stock: new Rational(0n),
      //     producers: { [producerId]: amount },
      //   };
      // }
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

      // const stock = state[itemId]?.producers?.[producerId];
      // if (stock?.gte(amount)) {
      //   Object.assign(state[itemId], {
      //     ...state[itemId],
      //     producers: {
      //       ...state[itemId].producers,
      //       [producerId]: stock.sub(amount),
      //     },
      //   });
      // }
    },
  },
});

export const {
  addItemStock,
  subItemStock,
  addProducerToItem,
  subProducerFromItem,
} = recordsSlice.actions;

export const { updateOne, upsertOne } = recordsAdapter;

export const recordsState = (state: RootState) => state.records;

export const { selectById: getItemRecordById, selectEntities } =
  recordsAdapter.getSelectors<RootState>((state) => state.records);

// export const takeItem = (id: string, amount: Rational) => {
//   // const item = useAppSelector(getItemRecordById(id));
// };

export default recordsSlice.reducer;
