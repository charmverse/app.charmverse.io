import type { BoardView } from '@packages/databases/boardView';
import { createBoardView } from '@packages/databases/boardView';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import { blockLoad, databaseViewsLoad, initialDatabaseLoad } from './databaseBlocksLoad';

import type { RootState } from './index';

/**
 * @loadedBoardViews is a map of boardIds for which we have loaded views
 */
type ViewsState = {
  current: string;
  views: { [key: string]: BoardView };
  loadedBoardViews: { [key: string]: boolean };
};

const viewsSlice = createSlice({
  name: 'views',
  initialState: { views: {}, current: '', loadedBoardViews: {} } as ViewsState,
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
        } else {
          delete state.views[view.id];
        }
      }
    },
    updateView: (state, action: PayloadAction<BoardView>) => {
      state.views[action.payload.id] = action.payload;
    },
    deleteViews: (state, action: PayloadAction<Pick<BoardView, 'id'>[]>) => {
      action.payload.forEach((deletedView) => {
        delete state.views[deletedView.id];
      });
    }
  },
  extraReducers: (builder) => {
    builder.addCase(initialDatabaseLoad.fulfilled, (state, action) => {
      state.views = state.views ?? {};
      state.loadedBoardViews = state.loadedBoardViews ?? {};
      for (const block of action.payload) {
        if (block.type === 'view') {
          state.views[block.id] = block as BoardView;
          state.loadedBoardViews[block.rootId] = true;
        }
      }
    });

    builder.addCase(databaseViewsLoad.fulfilled, (state, action) => {
      state.views = state.views ?? {};
      state.loadedBoardViews = state.loadedBoardViews ?? {};
      for (const block of action.payload) {
        if (block.type === 'view') {
          state.views[block.id] = block as BoardView;
          state.loadedBoardViews[block.rootId] = true;
        }
      }
    });

    builder.addCase(blockLoad.fulfilled, (state, action) => {
      state.views = state.views ?? {};
      const block = action.payload;
      if (block.type === 'view') {
        state.views[block.id] = block as BoardView;
      }
    });
  }
});

export const { updateViews, setCurrent, updateView, addView, deleteViews } = viewsSlice.actions;
export const { reducer } = viewsSlice;

export const getViews = (state: RootState): { [key: string]: BoardView } => state.views.views;

// export a factory to be memoized, so multiple instances can be used at once
export const makeSelectSortedViews = () =>
  createSelector(
    (state: RootState, boardId: string) => boardId,
    (state: RootState, boardId: string) => state.boards.boards[boardId],
    getViews,
    (boardId, board, views) => {
      const viewIds = board?.fields.viewIds?.length ? board?.fields.viewIds : Object.keys(views);
      return Object.values(views)
        .filter((v) => v.parentId === boardId)
        .sort((a, b) => (viewIds.indexOf(a.id) > viewIds.indexOf(b.id) ? 1 : -1))
        .map((v) => createBoardView(v));
    }
  );

export function getView(viewId: string | undefined): (state: RootState) => BoardView | null {
  return (state: RootState): BoardView | null => {
    return viewId ? (state.views.views[viewId] ?? null) : null;
  };
}

export const makeSelectView = () =>
  createSelector(
    getViews,
    (state: RootState, viewId: string) => viewId,
    (views, viewId) => {
      return views[viewId];
    }
  );

export function getLoadedBoardViews(): (state: RootState) => Record<string, boolean> {
  return (state: RootState): Record<string, boolean> => {
    return state.views.loadedBoardViews;
  };
}

export const getCurrentBoardViews = createSelector(
  (state: RootState) => state.boards.boards[state.boards.current],
  getViews,
  (
    board, // types are wrong: board is undefined by default
    views
  ) => {
    const viewIds = board?.fields.viewIds ? board?.fields.viewIds : Object.keys(views);
    return Object.values(views)
      .filter((v) => v.parentId === board?.id)
      .sort((a, b) => (viewIds.indexOf(a.id) > viewIds.indexOf(b.id) ? 1 : -1))
      .map((v) => createBoardView(v));
  }
);
