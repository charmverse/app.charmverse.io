/* eslint-disable no-continue */

import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { Board } from 'lib/focalboard/board';

import { blockLoad, initialDatabaseLoad } from './databaseBlocksLoad';

import type { RootState } from './index';

type BoardsState = {
  current: string;
  boards: { [key: string]: Board };
  templates: { [key: string]: Board };
  boardPages: { [key: string]: { title: string } };
};

const boardsSlice = createSlice({
  name: 'boards',
  initialState: { boards: {}, templates: {}, boardPages: {} } as BoardsState,
  reducers: {
    setCurrent: (state, action: PayloadAction<string>) => {
      state.current = action.payload;
    },
    addBoard: (state, action: PayloadAction<Board>) => {
      state.boards[action.payload.id] = action.payload;
    },
    updateBoards: (state, action: PayloadAction<(Partial<Board> & { id: string; partial?: boolean })[]>) => {
      for (const board of action.payload) {
        if (board.fields?.isTemplate) {
          const boardAfterUpdate = Object.assign(state.templates[board.id] || {}, board);
          state.templates[board.id] = boardAfterUpdate;
        } else if (board.partial) {
          const storedBoard = state.boards[board.id];
          state.boardPages[board.id] = { title: board.title ?? '' };
          if (storedBoard) {
            state.boards[board.id] = Object.assign(storedBoard, board);
          }
        } else {
          state.boards[board.id] = Object.assign(
            state.boards[board.id] || {},
            Object.assign(board, state.boardPages[board.id] || {})
          );
        }
      }
    },
    deleteBoards: (state, action: PayloadAction<Pick<Board, 'id'>[]>) => {
      action.payload.forEach((deletedBoard) => {
        delete state.boards[deletedBoard.id];
        delete state.boardPages[deletedBoard.id];
      });
    }
  },
  extraReducers: (builder) => {
    builder.addCase(initialDatabaseLoad.fulfilled, (state, action) => {
      state.boards = state.boards ?? {};
      state.templates = state.templates ?? {};
      for (const block of action.payload) {
        const board = block as Board;
        if (board.type !== 'board') {
          continue;
        }

        if (block.fields.isTemplate) {
          const boardAfterUpdate = Object.assign(state.templates[block.id] || {});
          state.templates[block.id] = boardAfterUpdate;
        } else {
          state.boards[block.id] = Object.assign(block, state.boardPages[block.id] || {}) as Board;
        }
      }
    });

    builder.addCase(blockLoad.fulfilled, (state, action) => {
      state.boards = state.boards ?? {};
      const block = action.payload;
      if (block.type === 'board') {
        state.boards[block.id] = Object.assign(block, state.boardPages[block.id] || {}) as Board;
      }
    });
  }
});

export const { updateBoards, setCurrent, addBoard, deleteBoards } = boardsSlice.actions;
export const { reducer } = boardsSlice;
export const getBoards = (state: RootState): { [key: string]: Board } => state.boards.boards;

export const getSortedBoards = createSelector(getBoards, (boards) => {
  return Object.values(boards).sort((a, b) => a.title.localeCompare(b.title));
});

export const getTemplates = (state: RootState): { [key: string]: Board } => state.boards.templates;

export const getSortedTemplates = createSelector(getTemplates, (templates) => {
  return Object.values(templates).sort((a, b) => a.title.localeCompare(b.title));
});

export const makeSelectBoard = () =>
  createSelector(
    getBoards,
    getTemplates,
    (state: RootState, boardId: string) => boardId,
    (boards, templates, boardId: string) => {
      return boards[boardId] || templates[boardId];
    }
  );

export const getCurrentBoard = createSelector(
  (state: RootState) => state.boards.current,
  getBoards,
  getTemplates,
  (
    boardId: string,
    boards: { [key: string]: Board },
    templates: {
      [key: string]: Board;
    }
  ) => {
    return boards[boardId] || templates[boardId];
  }
);
