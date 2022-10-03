
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { CommentBlock } from '../blocks/commentBlock';

import { initialLoad, initialReadOnlyLoad } from './initialLoad';

import type { RootState } from './index';

const commentsSlice = createSlice({
  name: 'comments',
  initialState: { comments: {} } as { comments: { [key: string]: CommentBlock } },
  reducers: {
    updateComments: (state, action: PayloadAction<CommentBlock[]>) => {
      for (const comment of action.payload) {
        if (comment.deletedAt === 0) {
          state.comments[comment.id] = comment;
        }
        else {
          delete state.comments[comment.id];
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(initialReadOnlyLoad.fulfilled, (state, action) => {
      state.comments = {};
      for (const block of action.payload) {
        if (block.type === 'comment') {
          state.comments[block.id] = block as CommentBlock;
        }
      }
    });
    builder.addCase(initialLoad.fulfilled, (state, action) => {
      state.comments = {};
      for (const block of action.payload.blocks) {
        if (block.type === 'comment') {
          state.comments[block.id] = block as CommentBlock;
        }
      }
    });
  }
});

export const { updateComments } = commentsSlice.actions;
export const { reducer } = commentsSlice;

export function getCardComments (cardId?: string): (state: RootState) => CommentBlock[] {
  return (state: RootState): CommentBlock[] => {
    return cardId ? Object.values(state.comments.comments)
      .filter((c) => c.parentId === cardId)
      .sort((a, b) => a.createdAt - b.createdAt) : [];
  };
}

// optimized version. see: https://react-redux.js.org/api/hooks
// export function getCardCommentsMemoFriendly (): (state: RootState, cardId: string) => CommentBlock[] {
//     return createDeepEqualSelector(
//         (state: RootState) => state.comments.comments,
//         (_: RootState, cardId: string) => cardId,
//         (comments, cardId: string): CommentBlock[] => {
//             return Object.values(comments).
//                 filter((c) => c.parentId === cardId).
//                 sort((a, b) => a.createdAt - b.createdAt)
//         }
//     )
// }
