
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { BoardView } from '../blocks/boardView';
import { createBoardView } from '../blocks/boardView';

import { getCurrentBoard } from './boards';
import { initialLoad, initialReadOnlyLoad } from './initialLoad';

import type { RootState } from './index';

type ViewsState = {
    current: string;
    views: { [key: string]: BoardView };
}

const viewsSlice = createSlice({
  name: 'views',
  initialState: { views: {}, current: '' } as ViewsState,
  reducers: {
    setCurrent: (state, action: PayloadAction<string>) => {
      state.current = action.payload;
    },
    addView: (state, action: PayloadAction<BoardView>) => {
      state.views[action.payload.id] = action.payload;
    },
    updateViews: (state, action: PayloadAction<BoardView[]>) => {
      for (const view of action.payload) {
        if (!view.deletedAt) {
          state.views[view.id] = view;
        }
        else {
          delete state.views[view.id];
        }
      }
    },
    updateView: (state, action: PayloadAction<BoardView>) => {
      state.views[action.payload.id] = action.payload;
    },
    deleteViews: (state, action: PayloadAction<Pick<BoardView, 'id'>[]>) => {
      action.payload.forEach(deletedView => {
        delete state.views[deletedView.id];
      });
    }
  },
  extraReducers: (builder) => {
    builder.addCase(initialReadOnlyLoad.fulfilled, (state, action) => {
      state.views = {};
      for (const block of action.payload) {
        if (block.type === 'view') {
          state.views[block.id] = block as BoardView;
        }
      }
    });
    builder.addCase(initialLoad.fulfilled, (state, action) => {
      state.views = {};
      for (const block of action.payload.blocks) {
        if (block.type === 'view') {
          state.views[block.id] = block as BoardView;
        }
      }
    });
  }
});

export const { updateViews, setCurrent, updateView, addView, deleteViews } = viewsSlice.actions;
export const { reducer } = viewsSlice;

export const getViews = (state: RootState): { [key: string]: BoardView } => state.views.views;
export const getSortedViews = createSelector(
  getViews,
  (views) => {
    return Object.values(views).sort((a, b) => a.title.localeCompare(b.title)).map((v) => createBoardView(v));
  }
);

export function getView (viewId: string): (state: RootState) => BoardView|null {
  return (state: RootState): BoardView|null => {
    return state.views.views[viewId] || null;
  };
}

export const getCurrentBoardViews = createSelector(
  (state: RootState) => state.boards.current,
  getViews,
  (boardId: string, views: {
      [key: string]: BoardView;
    }) => {
    return Object.values(views).filter((v) => v.parentId === boardId).sort((a, b) => a.title.localeCompare(b.title)).map((v) => createBoardView(v));
  }
);

export const getCurrentView = createSelector(
  getViews,
  (state: RootState) => state.views.current,
  (views, viewId) => {
    return views[viewId];
  }
);

export const getCurrentViewGroupBy = createSelector(
  getCurrentBoard,
  getCurrentView,
  (currentBoard, currentView) => {
    if (!currentBoard) {
      return undefined;
    }
    if (!currentView) {
      return undefined;
    }
    return currentBoard.fields.cardProperties.find((o) => o.id === currentView.fields.groupById);
  }
);

export const getCurrentViewDisplayBy = createSelector(
  getCurrentBoard,
  getCurrentView,
  (currentBoard, currentView) => {
    if (!currentBoard) {
      return undefined;
    }
    if (!currentView) {
      return undefined;
    }
    return currentBoard.fields.cardProperties.find((o) => o.id === currentView.fields.dateDisplayPropertyId);
  }
);
