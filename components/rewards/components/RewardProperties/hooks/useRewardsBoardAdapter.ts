import type { PageMeta } from '@charmverse/core/pages';
import { useEffect, useMemo, useState } from 'react';

import { sortCards } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { getDefaultBoard, getDefaultTableView } from 'components/rewards/components/RewardsBoard/utils/boardData';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useMembers } from 'hooks/useMembers';
import { useRewardBlocks } from 'hooks/useRewardBlocks';
import type { BlockTypes } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import { CardFilter } from 'lib/focalboard/cardFilter';
import type { Member } from 'lib/members/interfaces';
import {
  ASSIGNEES_BLOCK_ID,
  CREATED_AT_ID,
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
  const { membersRecord } = useMembers();
  const { rewards } = useRewards();
  const { rewardPropertiesBlock, rewardBlocks } = useRewardBlocks();
  const { getRewardPage } = useRewardPage();

  const rewardPage = getRewardPage(boardReward?.id);
  // TODO - use different types of views (board, calendar)
  const localViewSettings = useLocalDbViewSettings(`rewards-${DEFAULT_VIEW_BLOCK_ID}`);

  // board with all reward properties and default properties
  const board: Board = getDefaultBoard({
    storedBoard: rewardPropertiesBlock
  });

  const activeView = useMemo(() => {
    // use saved default block or build on the fly
    // TODO: use different types of views
    const viewBlock = rewardBlocks?.find((b) => b.id === DEFAULT_VIEW_BLOCK_ID);

    if (!viewBlock) {
      return getDefaultTableView({ storedBoard: rewardPropertiesBlock });
    }

    const boardView = blockToFBBlock(viewBlock) as BoardView;

    // sort by created at desc by default
    if (!boardView.fields.sortOptions?.length) {
      boardView.fields.sortOptions = [{ propertyId: CREATED_AT_ID, reversed: true }];
    }

    if (!localViewSettings) {
      throw new Error('localViewSettings provider not found');
    }

    const { localSort, localFilters } = localViewSettings;
    if (localSort) {
      boardView.fields = { ...boardView.fields, localSortOptions: localSort };
    }

    if (localFilters) {
      boardView.fields = { ...boardView.fields, localFilter: localFilters };
    }

    return boardView;
  }, [localViewSettings, rewardBlocks, rewardPropertiesBlock]);

  const cardPages: CardPage[] = useMemo(() => {
    let cards =
      rewards
        ?.map((p) => {
          const page = getRewardPage(p.id);

          return mapRewardToCardPage({ reward: p, rewardPage: page, spaceId: space?.id, members: membersRecord });
        })
        .filter((cp): cp is CardPage => !!cp.card && !!cp.page) || [];

    const filter = activeView?.fields.localFilter || activeView?.fields.filter;
    // filter cards by active view filter
    if (activeView?.fields.filter) {
      const cardsRaw = cards.map((cp) => cp.card);
      const filteredCardsIds = CardFilter.applyFilterGroup(filter, board.fields.cardProperties, cardsRaw).map(
        (c) => c.id
      );

      cards = cards.filter((cp) => filteredCardsIds.includes(cp.card.id));
    }

    const sortedCardPages = activeView ? sortCards(cards, board, activeView, membersRecord) : [];

    return sortedCardPages;
  }, [activeView, board, getRewardPage, membersRecord, rewards, space?.id]);

  const boardCustomProperties: Board = getDefaultBoard({
    storedBoard: rewardPropertiesBlock,
    customOnly: true
  });

  // card from current reward
  const card = mapRewardToCardPage({
    reward: boardReward,
    rewardPage,
    spaceId: space?.id,
    members: membersRecord
  }).card;

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
  spaceId,
  members
}: {
  reward: BoardReward | RewardWithUsers | null;
  rewardPage?: PageMeta;
  spaceId?: string;
  members: Record<string, Member>;
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
    [CREATED_AT_ID]:
      rewardPage && 'createdAt' in rewardPage && rewardPage.createdAt ? new Date(rewardPage.createdAt).getTime() : '',
    [REWARD_REVIEWERS_BLOCK_ID]: (reward && 'reviewers' in reward && reward.reviewers) || [],
    [ASSIGNEES_BLOCK_ID]: (reward && 'applications' in reward && reward.applications.map((a) => a.createdBy)) || []
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
              reward,
              members
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
  spaceId,
  members
}: {
  application: ApplicationMeta;
  rewardPage: PageMeta;
  reward: RewardWithUsers;
  spaceId?: string;
  members: Record<string, Member>;
}) {
  const applicationFields = { properties: {} };
  const applicationSpaceId = rewardPage?.spaceId || spaceId || '';

  applicationFields.properties = {
    ...applicationFields.properties,
    // add default field values on the fly
    [REWARDS_AVAILABLE_BLOCK_ID]: null,
    [ASSIGNEES_BLOCK_ID]: (application && 'createdBy' in application && application.createdBy) || '',
    [REWARD_STATUS_BLOCK_ID]: (application && 'status' in application && application.status) || '',
    [REWARDER_BLOCK_ID]: (application && 'createdBy' in application && [application.createdBy]) || '',
    [DUE_DATE_ID]: null,
    [REWARD_REVIEWERS_BLOCK_ID]: []
  };

  const card: Card<RewardPropertyValue> = {
    id: application.id || '',
    spaceId: applicationSpaceId,
    parentId: reward.id,
    schema: 1,
    title: '',
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
  const authorName = members[application.createdBy]?.username;
  const applicationPage: PageMeta = {
    id: application.id || '',
    spaceId: rewardPage?.spaceId || '',
    boardId: null,
    bountyId: rewardPage?.id || '',
    title: `Application ${authorName ? `from ${authorName}` : ''}`,
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
