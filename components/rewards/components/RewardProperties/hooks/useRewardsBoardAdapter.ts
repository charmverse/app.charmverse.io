import type { PageMeta } from '@charmverse/core/pages';
import { useMemo, useState } from 'react';

import { sortCards } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { getDefaultBoard, getDefaultTableView } from 'components/rewards/components/RewardsBoard/utils/boardData';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useRewardBlocks } from 'hooks/useRewardBlocks';
import type { BlockTypes } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import {
  ASSIGNEES_BLOCK_ID,
  DEFAULT_VIEW_BLOCK_ID,
  DUE_DATE_ID,
  REWARDER_BLOCK_ID,
  REWARDS_AVAILABLE_BLOCK_ID,
  REWARD_REVIEWERS_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID
} from 'lib/rewards/blocks/constants';
import type { RewardFields, RewardFieldsProp, RewardPropertyValue } from 'lib/rewards/blocks/interfaces';
import { countRemainingSubmissionSlots } from 'lib/rewards/countRemainingSubmissionSlots';
import type { ApplicationMeta, RewardWithUsers } from 'lib/rewards/interfaces';

export type BoardReward = { spaceId?: string; id?: string } & RewardFieldsProp;

export function useRewardsBoardAdapter() {
  const [boardReward, setBoardReward] = useState<BoardReward | null>(null);
  const { space } = useCurrentSpace();
  const { members } = useMembers();
  const { filteredRewards: rewards } = useRewards();
  const { pages } = usePages();
  const { rewardPropertiesBlock, rewardBlocks } = useRewardBlocks();
  const rewardPage = pages[boardReward?.id || ''];

  // board with all reward properties and default properties
  const board: Board = getDefaultBoard({
    storedBoard: rewardPropertiesBlock
  });

  const activeView = useMemo(() => {
    // use saved default block or build on the fly
    const viewBlock = rewardBlocks?.find((b) => b.id === DEFAULT_VIEW_BLOCK_ID);

    return viewBlock
      ? (blockToFBBlock(viewBlock) as BoardView)
      : getDefaultTableView({ storedBoard: rewardPropertiesBlock });
  }, [rewardPropertiesBlock, rewardBlocks]);

  const cardPages: CardPage[] = useMemo(() => {
    const cards =
      rewards
        ?.map((p) => {
          const page = pages[p?.id];

          return mapRewardToCardPage({ reward: p, rewardPage: page, spaceId: space?.id });
        })
        .filter((cp): cp is CardPage => !!cp.card && !!cp.page) || [];

    const sortedCardPages = activeView ? sortCards(cards, board, activeView, members) : [];

    return sortedCardPages;
  }, [activeView, board, members, pages, rewards, space?.id]);

  const boardCustomProperties: Board = getDefaultBoard({
    storedBoard: rewardPropertiesBlock,
    customOnly: true
  });

  // card from current reward
  const card = mapRewardToCardPage({ reward: boardReward, rewardPage, spaceId: space?.id }).card;

  // each reward with fields reflects a card
  const cards: Card[] = cardPages.map((cp) => cp.card) || [];

  const views: BoardView[] = [];

  return {
    board,
    boardCustomProperties,
    card,
    cards,
    cardPages,
    activeView,
    views,
    rewardPage,
    boardReward,
    setBoardReward
  };
}

// build mock card from reward and page data
function mapRewardToCardPage({
  reward,
  rewardPage,
  spaceId
}: {
  reward: BoardReward | RewardWithUsers | null;
  rewardPage?: PageMeta;
  spaceId?: string;
}): Omit<CardPage<RewardPropertyValue>, 'page'> & Partial<Pick<CardPage, 'page'>> {
  const rewardFields = (reward?.fields || { properties: {} }) as RewardFields;
  const rewardSpaceId = reward?.spaceId || spaceId || '';
  rewardFields.properties = {
    ...rewardFields.properties,
    // add default field values on the fly
    [REWARDS_AVAILABLE_BLOCK_ID]:
      reward && 'maxSubmissions' in reward && typeof reward.maxSubmissions === 'number' && reward.maxSubmissions > 0
        ? (
            countRemainingSubmissionSlots({
              applications: reward.applications ?? [],
              limit: reward.maxSubmissions
            }) as number
          )?.toString()
        : '-',
    [REWARD_STATUS_BLOCK_ID]: (reward && 'status' in reward && reward.status) || '',
    [REWARDER_BLOCK_ID]: (reward && 'createdBy' in reward && [reward.createdBy]) || '',
    // focalboard component expects a timestamp
    [DUE_DATE_ID]: reward && 'dueDate' in reward && reward.dueDate ? new Date(reward.dueDate).getTime() : '',
    [REWARD_REVIEWERS_BLOCK_ID]: (reward && 'reviewers' in reward && reward.reviewers) || []
  };

  const card: Card<RewardPropertyValue> = {
    id: reward?.id || '',
    spaceId: rewardSpaceId,
    parentId: '',
    schema: 1,
    title: rewardPage?.title || '',
    rootId: rewardSpaceId,
    type: 'card' as BlockTypes,
    updatedBy: rewardPage?.updatedBy || '',
    createdBy: rewardPage?.createdBy || '',
    createdAt: rewardPage?.createdAt ? new Date(rewardPage?.createdAt).getTime() : 0,
    updatedAt: rewardPage?.updatedAt ? new Date(rewardPage?.updatedAt).getTime() : 0,
    deletedAt: null,
    fields: { ...rewardFields, contentOrder: [] },
    customIconType: 'reward'
  };

  return {
    card,
    page: rewardPage,
    subPages:
      rewardPage && reward && 'applications' in reward
        ? reward.applications.map((application) =>
            mapApplicationToCardPage({
              application,
              rewardPage,
              spaceId,
              reward
            })
          )
        : undefined
  };
}

// build mock card from reward and page data
function mapApplicationToCardPage({
  application,
  rewardPage,
  reward,
  spaceId
}: {
  application: ApplicationMeta;
  rewardPage: PageMeta;
  reward: RewardWithUsers;
  spaceId?: string;
}) {
  const applicationFields = { properties: {} };
  const applicationSpaceId = rewardPage?.spaceId || spaceId || '';

  applicationFields.properties = {
    ...applicationFields.properties,
    // add default field values on the fly
    [REWARDS_AVAILABLE_BLOCK_ID]: '-',
    [ASSIGNEES_BLOCK_ID]: (application && 'createdBy' in application && [application.createdBy]) || '',
    [REWARD_STATUS_BLOCK_ID]: (application && 'status' in application && application.status) || '',
    [REWARDER_BLOCK_ID]: (application && 'createdBy' in application && [application.createdBy]) || '',
    [DUE_DATE_ID]: '-',
    [REWARD_REVIEWERS_BLOCK_ID]: []
  };

  const card: Card<RewardPropertyValue> = {
    id: application.id || '',
    spaceId: applicationSpaceId,
    parentId: reward.id,
    schema: 1,
    title: 'APP - rewardPage?.title' || '',
    rootId: applicationSpaceId,
    type: 'card' as BlockTypes,
    customIconType: 'applicationStatus',
    updatedBy: application.createdBy || '',
    createdBy: application.createdBy || '',
    createdAt: application.createdAt ? new Date(application.createdAt).getTime() : 0,
    updatedAt: application.updatedAt ? new Date(application.updatedAt).getTime() : 0,
    deletedAt: null,
    fields: { ...applicationFields, contentOrder: [] }
  };

  const applicationPage: PageMeta = {
    id: application.id || '',
    spaceId: rewardPage?.spaceId || '',
    boardId: null,
    bountyId: rewardPage?.id || '',
    title: rewardPage?.title || '',
    type: 'bounty',
    cardId: application.id || '',
    createdAt: new Date(application.createdAt),
    updatedAt: new Date(application.updatedAt),
    createdBy: application.createdBy || '',
    deletedAt: null,
    deletedBy: null,
    galleryImage: null,
    hasContent: false,
    headerImage: null,
    icon: null,
    index: 0,
    parentId: rewardPage?.id || '',
    path: application.id,
    proposalId: null,
    syncWithPageId: null,
    updatedBy: application.createdBy
  };

  return { card, page: applicationPage };
}
