import type { PageMeta } from '@charmverse/core/pages';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { BoardReward } from 'components/rewards/components/RewardProperties/hooks/useRewardsBoardAdapter';
import { useRewardsBoardAdapter } from 'components/rewards/components/RewardProperties/hooks/useRewardsBoardAdapter';
import type { BoardView } from 'lib/focalboard/boardView';
import type { CardPage } from 'lib/focalboard/card';
import type { RewardCard, RewardPropertyValue, RewardsBoardFFBlock } from 'lib/rewards/blocks/interfaces';

type RewardsBoardContextType = {
  board?: RewardsBoardFFBlock;
  card: RewardCard;
  cards: RewardCard[];
  cardPages: CardPage<RewardPropertyValue>[];
  activeView: BoardView;
  views: BoardView[];
  rewardPage: PageMeta | undefined;
  boardReward: BoardReward | null;
  setBoardReward: (boardReward: BoardReward | null) => void;
};

const RewardsBoardContext = createContext<Readonly<RewardsBoardContextType> | null>(null);

export function RewardsBoardProvider({ children }: { children: ReactNode }) {
  const boardContext = useRewardsBoardAdapter();

  return <RewardsBoardContext.Provider value={boardContext}>{children}</RewardsBoardContext.Provider>;
}

export const useRewardsBoard = () => {
  const context = useContext(RewardsBoardContext);
  if (!context) {
    throw new Error('useRewardsBoard must be used within a RewardsBoardProvider');
  }
  return context;
};
