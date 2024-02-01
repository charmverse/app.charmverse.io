import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from './index';

const searchTextSlice = createSlice({
  name: 'searchText',
  initialState: { value: '' } as { value: string },
  reducers: {
    setSearchText: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    }
  }
});

export const { setSearchText } = searchTextSlice.actions;
export const { reducer } = searchTextSlice;

export function getSearchText(state: RootState): string {
  return state.searchText.value;
}
