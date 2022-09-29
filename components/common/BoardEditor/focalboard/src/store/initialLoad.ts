
import { createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import charmClient from 'charmClient';

import { Subscription } from '../wsclient';

import type { RootState } from './index';

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

export const getUserBlockSubscriptions = (state: RootState): Subscription[] => state.users.blockSubscriptions;

export const getUserBlockSubscriptionList = createSelector(
  getUserBlockSubscriptions,
  (subscriptions) => subscriptions
);
