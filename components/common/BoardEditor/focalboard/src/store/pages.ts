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
    deletePages: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach((deletedPageId) => {
        delete state.pages[deletedPageId];
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

export const { updatePages, addPage, deletePages } = pagesSlice.actions;
export const { reducer } = pagesSlice;
