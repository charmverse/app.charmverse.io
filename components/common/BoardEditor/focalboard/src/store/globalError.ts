import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { initialDatabaseLoad } from './databaseBlocksLoad';

import type { RootState } from './index';

const globalErrorSlice = createSlice({
  name: 'globalError',
  initialState: { value: '' } as { value: string },
  reducers: {
    setGlobalError: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(initialDatabaseLoad.rejected, (state, action) => {
      state.value = action.error.message || '';
    });
  }
});

export const { setGlobalError } = globalErrorSlice.actions;
export const { reducer } = globalErrorSlice;

export const getGlobalError = (state: RootState): string => state.globalError.value;
