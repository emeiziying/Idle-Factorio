import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ItemCategory } from '../../types';

interface UIState {
  selectedTab: ItemCategory;
  selectedItem: string | null;
  modalOpen: boolean;
}

const initialState: UIState = {
  selectedTab: ItemCategory.RESOURCES,
  selectedItem: null,
  modalOpen: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedTab: (state, action: PayloadAction<ItemCategory>) => {
      state.selectedTab = action.payload;
    },
    
    selectItem: (state, action: PayloadAction<string>) => {
      state.selectedItem = action.payload;
      state.modalOpen = true;
    },
    
    closeModal: (state) => {
      state.modalOpen = false;
      // 不立即清除 selectedItem，让关闭动画能够正常显示
    },
    
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    }
  }
});

export const { setSelectedTab, selectItem, closeModal, clearSelectedItem } = uiSlice.actions;
export default uiSlice.reducer;