import type { PageMeta } from '@charmverse/core/pages';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import type { BoardProposal } from 'components/proposals/components/ProposalProperties/hooks/useProposalsBoardAdapter';
import { useProposalsBoardAdapter } from 'components/proposals/components/ProposalProperties/hooks/useProposalsBoardAdapter';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';

type ProposalsBoardContextType = {
  board: Board;
  boardCustomProperties: Board;
  card: Card;
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
  const {
    board,
    boardCustomProperties,
    card,
    cards,
    activeView,
    views,
    proposalPage,
    setBoardProposal,
    boardProposal,
    cardPages
  } = useProposalsBoardAdapter();

  const value = useMemo(
    () => ({
      board,
      boardCustomProperties,
      card,
      cards,
      activeView,
      views,
      proposalPage,
      setBoardProposal,
      boardProposal,
      cardPages
    }),
    [
      board,
      boardCustomProperties,
      card,
      cards,
      activeView,
      views,
      proposalPage,
      setBoardProposal,
      boardProposal,
      cardPages
    ]
  );

  return <ProposalsBoardContext.Provider value={value}>{children}</ProposalsBoardContext.Provider>;
}

export const useProposalsBoard = () => useContext(ProposalsBoardContext);
