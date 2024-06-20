import type { Recipe } from '@/models'
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit'

const technologiesAdapter = createEntityAdapter<Recipe>()

export const technologiesSlice = createSlice({
  name: 'technologies',
  initialState: technologiesAdapter.getInitialState<{
    researchedTechnologyIds: Recipe['id'][]
    researchingTechnologyEntity: Record<string, { id: Recipe['id'] }>
  }>(
    {
      // 已研究的科技
      researchedTechnologyIds: [],
      // 研究中的科技
      researchingTechnologyEntity: {},
    },
    [],
  ),
  reducers: {
    initializeBlocks: (state, action) => {
      // blocksAdapter.setAll(state, action.payload);
    },
  },
})

// export const getSavedData

export default technologiesSlice.reducer
