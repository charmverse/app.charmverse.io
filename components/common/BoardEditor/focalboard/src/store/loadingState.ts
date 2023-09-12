import { createSelector, createSlice } from '@reduxjs/toolkit';

import { initialDatabaseLoad } from './databaseBlocksLoad';

import type { RootState } from './index';

type LoadingState = {
  loaded: boolean;
};

const viewsSlice = createSlice({
  name: 'loadingState',
  initialState: { loaded: false } as LoadingState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(initialDatabaseLoad.fulfilled, (state, action) => {
      state.loaded = true;
    });
  }
});
export const { reducer } = viewsSlice;
export const getLoadingState = () =>
  createSelector(
    (state: RootState) => state.loadingState,
    (state: LoadingState) => state
  );
