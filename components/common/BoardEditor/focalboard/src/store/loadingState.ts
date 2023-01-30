import { createSelector, createSlice } from '@reduxjs/toolkit';

import { initialLoad, initialReadOnlyLoad } from './initialLoad';

import type { RootState } from './index';

type LoadingState = {
  loaded: boolean;
};

const viewsSlice = createSlice({
  name: 'loadingState',
  initialState: { loaded: false } as LoadingState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(initialReadOnlyLoad.fulfilled, (state, action) => {
      state.loaded = true;
    });
    builder.addCase(initialLoad.fulfilled, (state, action) => {
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
