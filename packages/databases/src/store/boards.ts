import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { Board } from '../board';

import { blockLoad, initialDatabaseLoad } from './databaseBlocksLoad';

import type { RootState } from './index';

type BoardsState = {
  current: string;
  boards: { [key: string]: Board };
  templates: { [key: string]: Board };
};

const boardsSlice = createSlice({
  name: 'boards',
  initialState: { boards: {}, templates: {} } as BoardsState,
  reducers: {
    setCurrent: (state, action: PayloadAction<string>) => {
      state.current = action.payload;
    },
    addBoard: (state, action: PayloadAction<Board>) => {
      state.boards[action.payload.id] = action.payload;
    },
    updateBoards: (state, action: PayloadAction<Board[]>) => {
      for (const board of action.payload) {
        /* if (board.deletedAt !== 0 && board.deletedAt !== null) {
                    delete state.boards[board.id]
                    delete state.templates[board.id]
                } else */
        if (board.fields?.isTemplate) {
          state.templates[board.id] = board;
        } else {
          const updated = Object.assign(state.boards[board.id] || {}, board);
          state.boards[board.id] = updated;
        }
      }
    },
    deleteBoards: (state, action: PayloadAction<Pick<Board, 'id'>[]>) => {
      action.payload.forEach((deletedBoard) => {
        delete state.boards[deletedBoard.id];
      });
    }
  },
  extraReducers: (builder) => {
    builder.addCase(initialDatabaseLoad.fulfilled, (state, action) => {
      state.boards = state.boards ?? {};
      state.templates = state.templates ?? {};
      for (const block of action.payload) {
        if (block.type === 'board' && block.fields.isTemplate) {
          state.templates[block.id] = block as Board;
        } else if (block.type === 'board' && !block.fields.isTemplate) {
          state.boards[block.id] = block as Board;
        }
      }
    });

    builder.addCase(blockLoad.fulfilled, (state, action) => {
      state.boards = state.boards ?? {};
      const block = action.payload;
      if (block.type === 'board') {
        state.boards[block.id] = block as Board;
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

export const makeSelectBoard = () =>
  createSelector(
    getBoards,
    (state: RootState, boardId: string) => boardId,
    (boards, boardId: string) => {
      return boards[boardId];
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
