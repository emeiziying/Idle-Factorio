import { Entities, type Rational } from '@/models'
import type { RootState } from '@/store/store'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ItemRecord = {
  stock: Rational
}

export type RecordsState = Entities<ItemRecord>

export const initialRecordsState: RecordsState = {}

export const recordsSlice = createSlice({
  name: 'records',
  initialState: initialRecordsState,
  reducers: {
    addItemStock: (
      state,
      action: PayloadAction<{ id: string; stock: Rational }>,
    ) => {
      const { id, stock } = action.payload
      if (state[id]) {
        state[id].stock = state[id].stock.add(stock)
      } else {
        state[id] = { stock }
      }
    },
    subItemStock: (
      state,
      action: PayloadAction<{ id: string; stock: Rational }>,
    ) => {
      const { id, stock } = action.payload
      if (state[id]?.stock.gte(stock)) {
        state[id].stock = state[id].stock.sub(stock)
      }
    },
    updateItemStock: (
      state,
      action: PayloadAction<{ id: string; stock: Rational }>,
    ) => {
      const { id, stock } = action.payload
      if (state[id]) {
        state[id].stock = stock
      } else {
        state[id] = { stock }
      }
    },
  },
})

export const { addItemStock, subItemStock, updateItemStock } =
  recordsSlice.actions

export const recordsState = (state: RootState): RecordsState => state.records

export default recordsSlice.reducer
