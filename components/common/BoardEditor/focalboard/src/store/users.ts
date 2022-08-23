// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';

import { default as client } from '../octoClient';
import { IUser } from '../user';

import { Utils } from '../utils';

import { Subscription } from '../wsclient';

import { initialLoad } from './initialLoad';

import { RootState } from './index';

type UsersStatus = {
  workspaceUsers: {[key: string]: IUser}
  blockSubscriptions: Array<Subscription>
}

export const fetchUserBlockSubscriptions = createAsyncThunk(
  'user/blockSubscriptions',
  async (userId: string) => (Utils.isFocalboardPlugin() ? client.getUserBlockSubscriptions(userId) : [])
);

const initialState = {
  workspaceUsers: {},
  userWorkspaces: [],
  blockSubscriptions: []
} as UsersStatus;

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setWorkspaceUsers: (state, action: PayloadAction<IUser[]>) => {
      state.workspaceUsers = action.payload.reduce((acc: {[key: string]: IUser}, user: IUser) => {
        acc[user.id] = user;
        return acc;
      }, {});
    },
    followBlock: (state, action: PayloadAction<Subscription>) => {
      state.blockSubscriptions.push(action.payload);
    },
    unfollowBlock: (state, action: PayloadAction<Subscription>) => {
      const oldSubscriptions = state.blockSubscriptions;
      state.blockSubscriptions = oldSubscriptions.filter((subscription) => subscription.blockId !== action.payload.blockId);
    }
  },
  extraReducers: (builder) => {
    builder.addCase(initialLoad.fulfilled, (state, action) => {
      state.workspaceUsers = action.payload.workspaceUsers.reduce((acc: {[key: string]: IUser}, user: IUser) => {
        acc[user.id] = user;
        return acc;
      }, {});
    });
    builder.addCase(fetchUserBlockSubscriptions.fulfilled, (state, action) => {
      state.blockSubscriptions = action.payload;
    });
  }
});

export const { setWorkspaceUsers } = usersSlice.actions;
export const { reducer } = usersSlice;

export const getWorkspaceUsers = (state: RootState): {[key: string]: IUser} => state.users.workspaceUsers;

export const getUser = (userId: string): (state: RootState) => IUser|undefined => {
  return (state: RootState): IUser|undefined => {
    const users = getWorkspaceUsers(state);
    return users[userId];
  };
};

export const { followBlock, unfollowBlock } = usersSlice.actions;
