
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { IUser } from '../user';

import { initialLoad } from './initialLoad';

import type { RootState } from './index';

type UsersStatus = {
  workspaceUsers: { [key: string]: IUser };
}

const initialState = {
  workspaceUsers: {},
  userWorkspaces: []
} as UsersStatus;

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setWorkspaceUsers: (state, action: PayloadAction<IUser[]>) => {
      state.workspaceUsers = action.payload.reduce((acc: { [key: string]: IUser }, user: IUser) => {
        acc[user.id] = user;
        return acc;
      }, {});
    }
  },
  extraReducers: (builder) => {
    builder.addCase(initialLoad.fulfilled, (state, action) => {
      state.workspaceUsers = action.payload.workspaceUsers.reduce((acc: { [key: string]: IUser }, user: IUser) => {
        acc[user.id] = user;
        return acc;
      }, {});
    });
  }
});

export const { setWorkspaceUsers } = usersSlice.actions;
export const { reducer } = usersSlice;

export const getWorkspaceUsers = (state: RootState): { [key: string]: IUser } => state.users.workspaceUsers;

export const getUser = (userId: string): (state: RootState) => IUser|undefined => {
  return (state: RootState): IUser|undefined => {
    const users = getWorkspaceUsers(state);
    return users[userId];
  };
};
