
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import type { Board } from '../blocks/board';
import client, { OctoClient } from '../octoClient';

import type { RootState } from './index';

export const fetchGlobalTemplates = createAsyncThunk(
  'globalTemplates/fetch',
  async () => {
    const rootClient = new OctoClient(client.serverUrl, '0');
    const rawBlocks = await rootClient.getGlobalTemplates();
    const allBoards = rawBlocks as Board[];
    return allBoards.filter((block) => block.fields.isTemplate).sort((a, b) => a.title.localeCompare(b.title)) as Board[];
  }
);

const globalTemplatesSlice = createSlice({
  name: 'globalTemplates',
  initialState: { value: [] } as { value: Board[] },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchGlobalTemplates.fulfilled, (state, action) => {
      state.value = action.payload || [];
    });
  }
});

export const { reducer } = globalTemplatesSlice;

export function getGlobalTemplates (state: RootState): Board[] {
  return state.globalTemplates.value;
}
