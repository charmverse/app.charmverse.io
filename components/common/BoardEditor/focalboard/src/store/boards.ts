
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { Board } from '../blocks/board';

import { initialLoad, initialReadOnlyLoad } from './initialLoad';

import type { RootState } from './index';

type BoardsState = {
    current: string;
    boards: { [key: string]: Board };
    templates: { [key: string]: Board };
}

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
        if (board.fields.isTemplate) {
          state.templates[board.id] = board;
        }
        else {
          state.boards[board.id] = board;
        }
      }
    },
    deleteBoards: (state, action: PayloadAction<Pick<Board, 'id'>[]>) => {
      action.payload.forEach(deletedBoard => {
        delete state.boards[deletedBoard.id];
      });
    }
  },
  extraReducers: (builder) => {
    builder.addCase(initialReadOnlyLoad.fulfilled, (state, action) => {
      state.boards = {};
      state.templates = {};
      for (const block of action.payload) {
        if (block.type === 'board' && block.fields.isTemplate) {
          state.templates[block.id] = block as Board;
        }
        else if (block.type === 'board' && !block.fields.isTemplate) {
          state.boards[block.id] = block as Board;
        }
      }
    });
    builder.addCase(initialLoad.fulfilled, (state, action) => {
      state.boards = {};
      state.templates = {};
      for (const block of action.payload.blocks) {
        if (block.type === 'board' && block.fields.isTemplate) {
          state.templates[block.id] = block as Board;
        }
        else if (block.type === 'board' && !block.fields.isTemplate) {
          state.boards[block.id] = block as Board;
        }
      }
    });
  }
});

export const { updateBoards, setCurrent, addBoard, deleteBoards } = boardsSlice.actions;
export const { reducer } = boardsSlice;
export const getBoards = (state: RootState): { [key: string]: Board } => state.boards.boards;

export const getSortedBoards = createSelector(
  getBoards,
  (boards) => {
    return Object.values(boards).sort((a, b) => a.title.localeCompare(b.title));
  }
);

export const getTemplates = (state: RootState): { [key: string]: Board } => state.boards.templates;

export const getSortedTemplates = createSelector(
  getTemplates,
  (templates) => {
    return Object.values(templates).sort((a, b) => a.title.localeCompare(b.title));
  }
);

export function getBoard (boardId: string): (state: RootState) => Board | undefined {
  return (state: RootState): Board | undefined => {
    return state.boards.boards[boardId] || state.boards.templates[boardId] || undefined;
  };
}

export const getCurrentBoard = createSelector(
  (state: RootState) => state.boards.current,
  getBoards,
  getTemplates,
  (boardId: string, boards: { [key: string]: Board }, templates: {
      [key: string]: Board;
    }) => {
    return boards[boardId] || templates[boardId];
  }
);
