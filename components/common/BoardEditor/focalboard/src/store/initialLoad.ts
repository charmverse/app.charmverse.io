// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import charmClient from 'charmClient';

import { Subscription } from '../wsclient';

import { RootState } from './index';

export const initialLoad = createAsyncThunk(
  'initialLoad',
  async () => {

    const [workspace, workspaceUsers, blocks, userWorkspaces] = await Promise.all([
      charmClient.getWorkspace(),
      charmClient.getWorkspaceUsers(),
      charmClient.getAllBlocks(),
      charmClient.getUserWorkspaces()
    ]);

    // if no workspace, either bad id, or user doesn't have access
    if (workspace === undefined) {
      throw new Error('Workspace undefined');
    }
    return {
      workspace,
      workspaceUsers,
      blocks,
      userWorkspaces
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

export const getUserBlockSubscriptions = (state: RootState): Array<Subscription> => state.users.blockSubscriptions;

export const getUserBlockSubscriptionList = createSelector(
  getUserBlockSubscriptions,
  (subscriptions) => subscriptions
);
