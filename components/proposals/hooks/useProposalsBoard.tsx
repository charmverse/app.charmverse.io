import type { PageMeta } from '@charmverse/core/pages';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import type { ProposalPropertyValue } from 'lib/proposal/blocks/interfaces';

import { useProposalsBoardAdapter } from '../ProposalPage/components/ProposalProperties/hooks/useProposalsBoardAdapter';
import type { BoardProposal } from '../ProposalPage/components/ProposalProperties/hooks/useProposalsBoardAdapter';

type ProposalsBoardContextType = {
  board: Board;
  boardCustomProperties: Board;
  card: Card<ProposalPropertyValue>;
  cards: Card[];
  cardPages: CardPage[];
  activeView: BoardView;
  views: BoardView[];
  proposalPage: PageMeta | undefined;
  boardProposal: BoardProposal | null;
  setBoardProposal: (boardProposal: BoardProposal | null) => void;
};

export const ProposalsBoardContext = createContext<Readonly<ProposalsBoardContextType>>({
  board: {} as Board,
  boardCustomProperties: {} as Board,
  card: {} as Card,
  cards: [],
  cardPages: [],
  activeView: {} as BoardView,
  views: [],
  proposalPage: undefined,
  boardProposal: null,
  setBoardProposal: () => {}
});

export function ProposalsBoardProvider({ children }: { children: ReactNode }) {
  const boardContext = useProposalsBoardAdapter();

  return <ProposalsBoardContext.Provider value={boardContext}>{children}</ProposalsBoardContext.Provider>;
}

export const useProposalsBoard = () => useContext(ProposalsBoardContext);
