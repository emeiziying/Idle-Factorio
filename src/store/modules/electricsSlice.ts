import { Rational, rational } from '@/models';
import { ElectricRecord } from '@/models/electric';
import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import { RootState } from '../store';

const electricsAdapter = createEntityAdapter<ElectricRecord>();

export const electricsSlice = createSlice({
  name: 'electrics',
  initialState: electricsAdapter.getInitialState(),
  reducers: {
    addElectricStock: (
      state,
      action: PayloadAction<{ id: string; amount: Rational }>
    ) => {
      const { id, amount } = action.payload;
      const { stock = rational(0) } = state.entities[id] || {};
      electricsAdapter.upsertOne(state, { id, stock: stock.add(amount) });
    },
    subElectricStock: (
      state,
      action: PayloadAction<{ id: string; amount: Rational }>
    ) => {
      const { id, amount } = action.payload;
      const { stock = rational(0) } = state.entities[id] || {};
      const result = stock.gte(amount) ? stock.sub(amount) : rational(0);
      electricsAdapter.updateOne(state, { id, changes: { stock: result } });
    },
  },
});

export const { addElectricStock, subElectricStock } = electricsSlice.actions;

export const electricsState = (state: RootState) => state.electrics;

export const { selectById: selectElectricById } =
  electricsAdapter.getSelectors(electricsState);

export default electricsSlice.reducer;
