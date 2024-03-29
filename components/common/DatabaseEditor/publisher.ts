import { batch } from 'react-redux';

import type { UIBlockWithDetails } from 'lib/databases/block';
import type { Board } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import type { Card } from 'lib/databases/card';

import store from './store';
import { deleteBoards, updateBoards } from './store/boards';
import { deleteCards, updateCards } from './store/cards';
import { deleteViews, updateViews } from './store/views';

// this code is normally called by a websocket connection in focalboard
export const publishIncrementalUpdate = async (blocks: UIBlockWithDetails[]) => {
  store.dispatch((dispatch) => {
    batch(() => {
      dispatch(updateBoards(blocks.filter((b: UIBlockWithDetails) => b.type === 'board') as Board[]));
      dispatch(updateViews(blocks.filter((b: UIBlockWithDetails) => b.type === 'view') as BoardView[]));
      dispatch(updateCards(blocks.filter((b: UIBlockWithDetails) => b.type === 'card') as Card[]));
    });
  });
};

export const publishDeletes = async (blocks: Pick<UIBlockWithDetails, 'id'>[]) => {
  store.dispatch((dispatch) => {
    batch(() => {
      dispatch(deleteBoards(blocks));
      dispatch(deleteViews(blocks));
      dispatch(deleteCards(blocks));
    });
  });
};
