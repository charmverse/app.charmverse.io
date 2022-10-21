
import { createAsyncThunk } from '@reduxjs/toolkit';

import charmClient from 'charmClient';

export const initialLoad = createAsyncThunk(
  'initialLoad',
  async ({ spaceId }: { spaceId: string }) => {

    const [workspaceUsers, blocks] = await Promise.all([
      charmClient.getWorkspaceUsers(spaceId),
      charmClient.getAllBlocks(spaceId)
    ]);

    return {
      workspaceUsers,
      blocks
    };
  }
);

export const initialReadOnlyLoad = createAsyncThunk(
  'initialReadOnlyLoad',
  async (boardId: string) => {
    const blocks = charmClient.getSubtree(boardId, 3);
    return blocks;
  }
);
