import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { BoardView } from 'lib/databases/boardView';
import type { Card } from 'lib/databases/card';
import type { RewardsBoardFFBlock } from 'lib/rewards/blocks/interfaces';

import { useRewardsBoardAdapter } from './useRewardsBoardAdapter';

type RewardsBoardContextType = {
  board: RewardsBoardFFBlock;
  cards: Card[];
  activeView: BoardView;
  views: BoardView[];
};

const RewardsBoardContext = createContext<Readonly<RewardsBoardContextType> | null>(null);

export function RewardsBoardProvider({ children }: { children: ReactNode }) {
  const boardContext = useRewardsBoardAdapter();

  return <RewardsBoardContext.Provider value={boardContext}>{children}</RewardsBoardContext.Provider>;
}

export const useRewardsBoardAndBlocks = () => {
  const context = useContext(RewardsBoardContext);
  if (!context) {
    throw new Error('useRewardsBoard must be used within a RewardsBoardProvider');
  }
  return context;
};
