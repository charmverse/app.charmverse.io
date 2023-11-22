import { createAsyncThunk } from '@reduxjs/toolkit';

import charmClient from 'charmClient';
import type { PagesMap } from 'lib/pages';

export const initialDatabaseLoad = createAsyncThunk('initialDatabaseLoad', async ({ pageId }: { pageId: string }) => {
  const blocks = charmClient.getSubtree({ pageId });
  return blocks;
});

export const databaseViewsLoad = createAsyncThunk('databaseViewsLoad', async ({ pageId }: { pageId: string }) => {
  const blocks = charmClient.getViews({ pageId });
  return blocks;
});

export const blockLoad = createAsyncThunk('blockLoad', async ({ blockId }: { blockId: string }) => {
  const blocks = charmClient.getBlock({ blockId });
  return blocks;
});

export const pagesLoad = createAsyncThunk('pagesLoad', async ({ pagesMap }: { pagesMap: PagesMap }) => {
  return pagesMap;
});
