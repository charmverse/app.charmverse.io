import { createContext, useContext } from 'react';
import { Board } from 'components/common/BoardEditor/focalboard/src/blocks/board';
import { Card } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import { PagesMap } from 'hooks/usePages';
import { View } from './interfaces';

export interface DatabaseContext {
  activeViewId?: string;
  board: Board;
  cards: Record<string, Card>;
  pages: PagesMap;
  views: View[];
}

export const DatabaseContext = createContext<DatabaseContext>({
  board: {} as Board,
  cards: {},
  pages: {},
  views: []
});

export const useDatabase = () => useContext(DatabaseContext);
