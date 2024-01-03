import type { PageMeta } from '@charmverse/core/pages';
import { useMemo, useState } from 'react';

import { sortCards } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { getDefaultBoard, getDefaultView } from 'components/rewards/components/RewardsBoard/utils/boardData';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useRewardBlocks } from 'hooks/useRewardBlocks';
import type { BlockTypes } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import type { BoardView, IViewType } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import { CardFilter } from 'lib/focalboard/cardFilter';
import { Constants } from 'lib/focalboard/constants';
import { viewTypeToBlockId } from 'lib/focalboard/customBlocks/constants';
import type { Member } from 'lib/members/interfaces';
import type { PagesMap } from 'lib/pages';
import {
  REWARDS_APPLICANTS_BLOCK_ID,
  CREATED_AT_ID,
  DEFAULT_VIEW_BLOCK_ID,
  DUE_DATE_ID,
  REWARDER_BLOCK_ID,
  REWARDS_AVAILABLE_BLOCK_ID,
  REWARD_REVIEWERS_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID,
  REWARD_AMOUNT,
  REWARD_CHAIN,
  REWARD_CUSTOM_VALUE,
  REWARD_TOKEN,
  REWARD_APPLICANTS_COUNT,
  REWARD_PROPOSAL_LINK
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
  const { rewardBoardBlock, rewardBlocks } = useRewardBlocks();
  const { getRewardPage } = useRewardPage();
  const hasMilestoneRewards = useMemo(() => rewards?.some((r) => !!r.proposalId), [rewards]);
  const { pages } = usePages();

  const {
    router: { query }
  } = useCharmRouter();
  const rewardPage = getRewardPage(boardReward?.id);

  // board with all reward properties and default properties
  const board: Board = getDefaultBoard({
    storedBoard: rewardBoardBlock,
    hasMilestoneRewards
  });

  const views = useMemo(() => {
    return board.fields.viewIds
      .map((vId) => rewardBlocks?.find((b) => b.id === vId) as BoardView)
      .filter(Boolean)
      .map((v) => {
        const view = { ...v };
        if (v.fields.viewType === 'table' && v.fields?.visiblePropertyIds?.length) {
          const visibleIds = [...v.fields.visiblePropertyIds];
          if (hasMilestoneRewards) {
            const proposalIndex = visibleIds.indexOf(REWARD_PROPOSAL_LINK);
            if (proposalIndex === -1) {
              const titleIndex = visibleIds.indexOf(Constants.titleColumnId);
              visibleIds.splice(titleIndex === 0 ? titleIndex + 1 : 0, 0, REWARD_PROPOSAL_LINK);
            }
          } else {
            visibleIds.filter((id) => id !== REWARD_PROPOSAL_LINK);
          }

          view.fields.visiblePropertyIds = Array.from(new Set(visibleIds));
        }

        return view;
      });
  }, [board.fields.viewIds, hasMilestoneRewards, rewardBlocks]);
  const queryViewType =
    viewTypeToBlockId[query?.viewId?.toString() as IViewType] || query?.viewId?.toString() || DEFAULT_VIEW_BLOCK_ID;

  const activeViewId = board.fields.viewIds?.find((vid) => vid === queryViewType)
    ? queryViewType
    : board.fields.viewIds?.[0];

  const localViewSettings = useLocalDbViewSettings(`rewards-${space?.id}-${activeViewId}`);

  const activeView = useMemo(() => {
    const viewBlock = views?.find((v) => v.id === activeViewId);

    if (!viewBlock) {
      return getDefaultView({ viewType: activeViewId, spaceId: space?.id || '' });
    }

    const boardView = blockToFBBlock(viewBlock as any) as BoardView;

    // sort by created at desc by default
    if (!boardView.fields.sortOptions?.length) {
      boardView.fields.sortOptions = [{ propertyId: CREATED_AT_ID, reversed: true }];
    }

    return boardView;
  }, [views, activeViewId, space?.id]);

  const cardPages: CardPage[] = useMemo(() => {
    let cards =
      rewards
        ?.map((p) => {
          const page = getRewardPage(p.id);

          return mapRewardToCardPage({
            reward: p,
            rewardPage: page,
            spaceId: space?.id,
            members: membersRecord,
            pages
          });
        })
        .filter((cp): cp is CardPage => !!cp.card && !!cp.page) || [];

    const filter = localViewSettings?.localFilters || activeView?.fields.filter;
    // filter cards by active view filter
    if (activeView?.fields.filter) {
      const cardsRaw = cards.map((cp) => cp.card);
      const filteredCardsIds = CardFilter.applyFilterGroup(filter, board.fields.cardProperties, cardsRaw).map(
        (c) => c.id
      );

      cards = cards.filter((cp) => filteredCardsIds.includes(cp.card.id));
    }
    const sortedCardPages = activeView
      ? sortCards(cards, board, activeView, membersRecord, localViewSettings?.localSort)
      : [];

    return sortedCardPages;
  }, [
    activeView,
    board,
    getRewardPage,
    localViewSettings?.localFilters,
    localViewSettings?.localSort,
    membersRecord,
    pages,
    rewards,
    space?.id
  ]);

  const boardCustomProperties: Board = getDefaultBoard({
    storedBoard: rewardBoardBlock,
    customOnly: true
  });

  // card from current reward
  const card = mapRewardToCardPage({
    reward: boardReward,
    rewardPage,
    spaceId: space?.id,
    members: membersRecord,
    pages
  }).card;

  // each reward with fields reflects a card
  const cards: Card[] = cardPages.map((cp) => cp.card) || [];

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
  members,
  pages
}: {
  reward: BoardReward | RewardWithUsers | null;
  rewardPage?: PageMeta;
  spaceId?: string;
  members: Record<string, Member>;
  pages: PagesMap;
}): Omit<CardPage<RewardPropertyValue>, 'page'> & Partial<Pick<CardPage, 'page'>> {
  const rewardFields = (reward?.fields || { properties: {} }) as RewardFields;
  const rewardSpaceId = reward?.spaceId || spaceId || '';
  const validApplications =
    reward && 'applications' in reward
      ? reward.applications.filter((application) => members[application.createdBy])
      : [];

  const proposalPage = reward && 'proposalId' in reward && reward.proposalId ? pages[reward.proposalId] : null;
  const proposalLinkValue = proposalPage ? [proposalPage.title, `/${proposalPage.path}`] : '';
  const assignedSubmitters =
    reward && 'assignedSubmitters' in reward && reward.assignedSubmitters ? reward.assignedSubmitters : null;
  const isAssignedReward = !!assignedSubmitters && assignedSubmitters.length > 0;

  rewardFields.isAssigned = isAssignedReward;
  rewardFields.properties = {
    ...rewardFields.properties,
    [Constants.titleColumnId]: rewardPage?.title || '',
    // add default field values on the fly
    [REWARDS_AVAILABLE_BLOCK_ID]: isAssignedReward
      ? 1
      : reward && 'maxSubmissions' in reward && typeof reward.maxSubmissions === 'number' && reward.maxSubmissions > 0
      ? (
          countRemainingSubmissionSlots({
            applications: validApplications,
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
    [REWARDS_APPLICANTS_BLOCK_ID]: isAssignedReward ? assignedSubmitters : validApplications.map((a) => a.createdBy),
    [REWARD_AMOUNT]: (reward && 'rewardAmount' in reward && reward.rewardAmount) || '',
    [REWARD_CHAIN]: (reward && 'chainId' in reward && reward.chainId?.toString()) || '',
    [REWARD_CUSTOM_VALUE]: (reward && 'customReward' in reward && reward.customReward) || '',
    [REWARD_TOKEN]: (reward && 'rewardToken' in reward && reward.rewardToken) || '',
    [REWARD_APPLICANTS_COUNT]: isAssignedReward ? 1 : validApplications.length.toString(),
    [REWARD_PROPOSAL_LINK]: proposalLinkValue
  };

  const card: Card<RewardPropertyValue> = {
    // use page id as card id - kanban board is based on usePages
    id: rewardPage?.id || '',
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
        ? reward.applications
            .filter((application) => members[application.createdBy])
            .map((application) =>
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
    [REWARDS_APPLICANTS_BLOCK_ID]: (application && 'createdBy' in application && application.createdBy) || '',
    [REWARD_STATUS_BLOCK_ID]: (application && 'status' in application && application.status) || '',
    [REWARDER_BLOCK_ID]: (application && 'createdBy' in application && [application.createdBy]) || '',
    [DUE_DATE_ID]: null,
    [REWARD_REVIEWERS_BLOCK_ID]: [],
    [REWARD_APPLICANTS_COUNT]: null
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
    updatedBy: application.createdBy,
    sourceTemplateId: null
  };

  return { card, page: applicationPage };
}
