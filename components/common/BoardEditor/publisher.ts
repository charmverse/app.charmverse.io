
import { batch } from 'react-redux';

import type { Block } from './focalboard/src/blocks/block';
import type { Board } from './focalboard/src/blocks/board';
import type { BoardView } from './focalboard/src/blocks/boardView';
import type { Card } from './focalboard/src/blocks/card';
import type { CommentBlock } from './focalboard/src/blocks/commentBlock';
import store from './focalboard/src/store';
import { deleteBoards, updateBoards } from './focalboard/src/store/boards';
import { deleteCards, updateCards } from './focalboard/src/store/cards';
import { updateComments } from './focalboard/src/store/comments';
import { deleteViews, updateViews } from './focalboard/src/store/views';

// this code is normally called by a websocket connection in focalboard
export const publishIncrementalUpdate = async (blocks: Block[]) => {
  store.dispatch((dispatch) => {
    batch(() => {
      dispatch(updateBoards(blocks.filter((b: Block) => b.type === 'board' || b.deletedAt !== 0) as Board[]));
      dispatch(updateViews(blocks.filter((b: Block) => b.type === 'view' || b.deletedAt !== 0) as BoardView[]));
      dispatch(updateCards(blocks.filter((b: Block) => b.type === 'card' || b.deletedAt !== 0) as Card[]));
      dispatch(updateComments(blocks.filter((b: Block) => b.type === 'comment' || b.deletedAt !== 0) as CommentBlock[]));
    });
  });
};

export const publishDeletes = async (blocks: (Pick<Block, 'id'> & { type: string })[]) => {
  store.dispatch((dispatch) => {
    batch(() => {
      dispatch(deleteBoards(blocks.filter((b => b.type === 'board'))));
      dispatch(deleteViews(blocks.filter((b => b.type === 'view'))));
      dispatch(deleteCards(blocks.filter((b => b.type === 'card'))));
    });
  });
};
