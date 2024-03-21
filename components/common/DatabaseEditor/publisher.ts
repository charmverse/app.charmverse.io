import { batch } from 'react-redux';

import type { Block } from 'lib/databases/block';
import type { Board } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import type { Card } from 'lib/databases/card';

import store from './store';
import { deleteBoards, updateBoards } from './store/boards';
import { deleteCards, updateCards } from './store/cards';
import { deleteViews, updateViews } from './store/views';

// this code is normally called by a websocket connection in focalboard
export const publishIncrementalUpdate = async (blocks: Block[]) => {
  store.dispatch((dispatch) => {
    batch(() => {
      dispatch(updateBoards(blocks.filter((b: Block) => b.type === 'board') as Board[]));
      dispatch(updateViews(blocks.filter((b: Block) => b.type === 'view') as BoardView[]));
      dispatch(updateCards(blocks.filter((b: Block) => b.type === 'card') as Card[]));
    });
  });
};

export const publishDeletes = async (blocks: (Pick<Block, 'id'> & { type: string })[]) => {
  store.dispatch((dispatch) => {
    batch(() => {
      dispatch(deleteBoards(blocks.filter((b) => b.type === 'board')));
      dispatch(deleteViews(blocks.filter((b) => b.type === 'view')));
      dispatch(deleteCards(blocks.filter((b) => b.type === 'card')));
    });
  });
};
