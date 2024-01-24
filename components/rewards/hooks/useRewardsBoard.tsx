import type { PageMeta } from '@charmverse/core/pages';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { PageListItemsRecord } from 'components/common/BoardEditor/interfaces';
import type { BoardReward } from 'components/rewards/components/RewardProperties/hooks/useRewardsBoardAdapter';
import { useRewardsBoardAdapter } from 'components/rewards/components/RewardProperties/hooks/useRewardsBoardAdapter';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { CardPage } from 'lib/focalboard/card';
import type { RewardCard, RewardPropertyValue } from 'lib/rewards/blocks/interfaces';

type RewardsBoardContextType = {
  board: Board;
  boardCustomProperties: Board;
  card: RewardCard;
  cards: RewardCard[];
  cardPages: CardPage<RewardPropertyValue>[];
  activeView: BoardView;
  views: BoardView[];
  rewardPage: PageMeta | undefined;
  boardReward: BoardReward | null;
  setBoardReward: (boardReward: BoardReward | null) => void;
  relationPropertiesCardsRecord: PageListItemsRecord;
};

const RewardsBoardContext = createContext<Readonly<RewardsBoardContextType>>({
  board: {} as Board,
  boardCustomProperties: {} as Board,
  card: {} as RewardCard,
  cards: [],
  cardPages: [],
  activeView: {} as BoardView,
  views: [],
  rewardPage: undefined,
  boardReward: null,
  setBoardReward: () => {},
  relationPropertiesCardsRecord: {}
});

export function RewardsBoardProvider({ children }: { children: ReactNode }) {
  const boardContext = useRewardsBoardAdapter();

  return <RewardsBoardContext.Provider value={boardContext}>{children}</RewardsBoardContext.Provider>;
}

export const useRewardsBoard = () => useContext(RewardsBoardContext);
