import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

interface InventoryState {
  stocks: Record<string, number> // itemId -> quantity
  capacity: Record<string, number> // itemId -> max capacity
}

const initialState: InventoryState = {
  stocks: {
    // 初始资源
    iron_ore: 100,
    copper_ore: 50,
    coal: 50,
    stone: 50,
    wood: 100,
  },
  capacity: {}, // 默认无限容量
}

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<{ itemId: string; amount: number }>) => {
      const { itemId, amount } = action.payload
      state.stocks[itemId] = (state.stocks[itemId] || 0) + amount

      // 检查容量限制
      const capacity = state.capacity[itemId]
      if (capacity && state.stocks[itemId] > capacity) {
        state.stocks[itemId] = capacity
      }
    },

    removeItem: (state, action: PayloadAction<{ itemId: string; amount: number }>) => {
      const { itemId, amount } = action.payload
      state.stocks[itemId] = Math.max(0, (state.stocks[itemId] || 0) - amount)
    },

    setItemStock: (state, action: PayloadAction<{ itemId: string; amount: number }>) => {
      const { itemId, amount } = action.payload
      state.stocks[itemId] = amount
    },

    setCapacity: (state, action: PayloadAction<{ itemId: string; capacity: number }>) => {
      const { itemId, capacity } = action.payload
      state.capacity[itemId] = capacity
    },
  },
})

export const { addItem, removeItem, setItemStock, setCapacity } = inventorySlice.actions
export default inventorySlice.reducer
