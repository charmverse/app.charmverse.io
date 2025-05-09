import { createAsyncThunk } from '@reduxjs/toolkit';

import charmClient from 'charmClient';

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
