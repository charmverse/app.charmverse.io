import type { PageMeta } from '@charmverse/core/pages';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { PagesMap } from 'lib/pages/interfaces';

import { pagesLoad } from './databaseBlocksLoad';

type PagesState = {
  pages: PagesMap;
};

const pagesSlice = createSlice({
  name: 'pages',
  initialState: {
    pages: {}
  } as PagesState,
  reducers: {
    addPage: (state, action: PayloadAction<PageMeta>) => {
      state.pages[action.payload.id] = action.payload;
    },
    updatePages: (state, action: PayloadAction<PageMeta[]>) => {
      for (const page of action.payload) {
        if (page.deletedAt) {
          delete state.pages[page.id];
        } else {
          const pageAfterUpdate = Object.assign(state.pages[page.id] || {}, page);
          state.pages[page.id] = pageAfterUpdate;
        }
      }
    },
    updatePage: (state, { payload }: PayloadAction<Partial<PageMeta>>) => {
      if (payload.id) {
        const page = state.pages[payload.id];
        if (page) {
          state.pages[payload.id] = { ...page, ...payload };
        }
      }
    },
    deletePages: (state, action: PayloadAction<Pick<PageMeta, 'id'>[]>) => {
      action.payload.forEach((deletedPage) => {
        delete state.pages[deletedPage.id];
      });
    }
  },
  extraReducers: (builder) => {
    builder.addCase(pagesLoad.fulfilled, (state, action) => {
      const pagesMap = action.payload;
      state.pages = pagesMap;
    });
  }
});

export const { updatePage, updatePages, addPage, deletePages } = pagesSlice.actions;
export const { reducer } = pagesSlice;
