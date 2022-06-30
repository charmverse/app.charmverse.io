import { createContext, useContext } from 'react';
import { Board } from 'components/common/BoardEditor/focalboard/src/blocks/board';
import { Card } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import { BoardView } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import { PagesMap } from 'hooks/usePages';

export interface DatabaseContext {
  activeViewId?: string;
  board: Board;
  cards: Record<string, Card>;
  pages: PagesMap;
  views: BoardView[];
}

export const DatabaseContext = createContext<DatabaseContext>({
  board: {} as Board,
  cards: {},
  pages: {},
  views: []
});

export const useDatabase = () => useContext(DatabaseContext);
