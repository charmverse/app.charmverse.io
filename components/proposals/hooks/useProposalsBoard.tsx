import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { KeyedMutator } from 'swr';

import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import type { ProposalWithUsersLite } from 'lib/proposals/getProposals';

import { useProposalsBoardAdapter } from '../ProposalPage/components/ProposalProperties/hooks/useProposalsBoardAdapter';

export type ProposalsBoardContextType = {
  board: Board;
  boardCustomProperties: Board;
  cards: Card[];
  cardPages: CardPage[];
  activeView: BoardView;
  views: BoardView[];
  isLoading: boolean;
  refreshProposals: KeyedMutator<ProposalWithUsersLite[]>;
};

export const ProposalsBoardContext = createContext<Readonly<ProposalsBoardContextType | null>>(null);

export function ProposalsBoardProvider({ children }: { children: ReactNode }) {
  const boardContext = useProposalsBoardAdapter();

  return <ProposalsBoardContext.Provider value={boardContext}>{children}</ProposalsBoardContext.Provider>;
}

export const useProposalsBoard = () => {
  const context = useContext(ProposalsBoardContext);
  if (!context) {
    throw new Error('useProposalsBoard must be used within a ProposalsBoardProvider');
  }
  return context;
};
