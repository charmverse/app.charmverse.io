import { createAsyncThunk } from '@reduxjs/toolkit';

import charmClient from 'charmClient';

export const initialDatabaseLoad = createAsyncThunk(
  'initialDatabaseLoad',
  async ({ pageIdOrPath, spaceId }: { pageIdOrPath: string; spaceId?: string }) => {
    const blocks = charmClient.getSubtree({ pageIdOrPath, spaceId });
    return blocks;
  }
);

export const databaseViewsLoad = createAsyncThunk(
  'databaseViewsLoad',
  async ({ pageIdOrPath, spaceId }: { pageIdOrPath: string; spaceId?: string }) => {
    const blocks = charmClient.getViews({ pageIdOrPath, spaceId });
    return blocks;
  }
);
