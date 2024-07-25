import { ElectricRecord } from '@/models/electric';
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

const electricsAdapter = createEntityAdapter<ElectricRecord>();

export const electricsSlice = createSlice({
  name: 'electrics',
  initialState: electricsAdapter.getInitialState(),
  reducers: {},
});

export default electricsSlice.reducer;
