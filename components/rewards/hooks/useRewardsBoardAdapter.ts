import type { PageMeta } from '@charmverse/core/pages';
import { useMemo } from 'react';

import { sortCards } from 'components/common/DatabaseEditor/store/cards';
import { blockToFBBlock } from 'components/common/DatabaseEditor/utils/blockUtils';
import { useRewardBlocks } from 'components/rewards/hooks/useRewardBlocks';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useMembers } from 'hooks/useMembers';
import type { BoardView, IViewType } from 'lib/databases/boardView';
import type { Card, CardWithRelations } from 'lib/databases/card';
import { CardFilter } from 'lib/databases/cardFilter';
import { Constants } from 'lib/databases/constants';
import { viewTypeToBlockId } from 'lib/databases/customBlocks/constants';
import type { Member } from 'lib/members/interfaces';
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
import type { RewardFields } from 'lib/rewards/blocks/interfaces';
import { getDefaultView } from 'lib/rewards/blocks/views';
import { countRemainingSubmissionSlots } from 'lib/rewards/countRemainingSubmissionSlots';
import type { ApplicationMeta, RewardWithUsers } from 'lib/rewards/interfaces';
import { isTruthy } from 'lib/utils/types';

export type BoardReward = { id?: string; fields: RewardFields };

export function useRewardsBoardAdapter() {
  const { space } = useCurrentSpace();
  const { membersRecord } = useMembers();
  const { rewards, mutateRewards } = useRewards();
  const { getRewardPage } = useRewardPage();
  const { rewardsBoardBlock: board, rewardBlocks } = useRewardBlocks();

  const {
    router: { query }
  } = useCharmRouter();

  const views = useMemo(() => {
    return (board?.fields.viewIds || [])
      .map((vId) => rewardBlocks?.find((b) => b.id === vId) as BoardView)
      .filter(Boolean);
  }, [board?.fields.viewIds, rewardBlocks]);
  const queryViewType =
    viewTypeToBlockId[query?.viewId?.toString() as IViewType] || query?.viewId?.toString() || DEFAULT_VIEW_BLOCK_ID;

  const activeViewId =
    (board?.fields.viewIds?.find((vid) => vid === queryViewType) ? queryViewType : board?.fields.viewIds?.[0]) ??
    // Ideally this should never occur, there must be atleast a single view id, but if it does, we should default to the first view
    DEFAULT_VIEW_BLOCK_ID;

  const localViewSettings = useLocalDbViewSettings(`rewards-${space?.id}-${activeViewId}`);

  const activeView = useMemo(() => {
    const viewBlock = views?.find((v) => v.id === activeViewId);

    if (!viewBlock && activeViewId) {
      const boardView = getDefaultView({ spaceId: space?.id || '' });

      // sort by created at desc by default
      if (!boardView.fields.sortOptions?.length) {
        boardView.fields.sortOptions = [{ propertyId: CREATED_AT_ID, reversed: true }];
      }

      return boardView;
    }

    const boardView = blockToFBBlock(viewBlock as any) as BoardView;
    return boardView;
  }, [views, activeViewId, space?.id]);

  const sortedCards = useMemo(() => {
    let cards = (rewards || [])
      .map((reward) => {
        const page = getRewardPage(reward.id);
        if (!page || !space) return null;

        return {
          ...mapRewardToCard({
            reward,
            spaceId: space.id,
            rewardPage: page,
            members: membersRecord
          }),
          reward: {
            id: reward.id,
            rewardType: reward.rewardType
          }
        } as CardWithRelations;
      })
      .filter(isTruthy);

    const filter = localViewSettings?.localFilters || activeView?.fields.filter;
    // filter cards by active view filter
    if (activeView.fields.filter && board) {
      const filteredCardsIds = CardFilter.applyFilterGroup(filter, board.fields.cardProperties, cards).map((c) => c.id);

      cards = cards.filter((cp) => filteredCardsIds.includes(cp.id));
    }
    const sortedCardPages = board
      ? sortCards(cards, board, activeView, membersRecord, {}, localViewSettings?.localSort)
      : [];

    return sortedCardPages;
  }, [
    activeView,
    board,
    getRewardPage,
    localViewSettings?.localFilters,
    localViewSettings?.localSort,
    membersRecord,
    rewards,
    space
  ]);

  return {
    board,
    cards: sortedCards,
    activeView,
    views,
    refreshRewards: mutateRewards
  };
}

// build mock card from reward and page data
export function mapRewardToCard({
  reward,
  rewardPage,
  spaceId,
  members
}: {
  reward:
    | Pick<BoardReward, 'fields' | 'id'>
    | Pick<
        RewardWithUsers,
        | 'applications'
        | 'fields'
        | 'id'
        | 'assignedSubmitters'
        | 'dueDate'
        | 'maxSubmissions'
        | 'reviewers'
        | 'rewardAmount'
        | 'rewardToken'
        | 'customReward'
        | 'status'
        | 'sourceProposalPage'
      >;
  rewardPage?: Pick<PageMeta, 'id' | 'createdAt' | 'createdBy' | 'title' | 'path' | 'updatedBy' | 'updatedAt'>;
  spaceId: string;
  members?: Record<string, Member>;
}): CardWithRelations {
  const rewardFields = (reward.fields || { properties: {} }) as RewardFields;
  const validApplications =
    reward && 'applications' in reward
      ? members
        ? reward.applications.filter((application) => members[application.createdBy])
        : reward.applications
      : [];

  const sourceProposalPage = (reward as RewardWithUsers).sourceProposalPage;
  const proposalLinkValue = sourceProposalPage ? [sourceProposalPage.title, `/${sourceProposalPage.id}`] : '';
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
      : '',
    [REWARD_STATUS_BLOCK_ID]: (reward && 'status' in reward && reward.status) || '',
    [REWARDER_BLOCK_ID]: (rewardPage?.createdBy && [rewardPage.createdBy]) || '',
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

  const card: CardWithRelations = {
    // use page id as card id - kanban board is based on usePages
    id: rewardPage?.id || '',
    spaceId,
    pageId: rewardPage?.id || '',
    title: rewardPage?.title || '',
    rootId: spaceId,
    type: 'card' as const,
    updatedBy: rewardPage?.updatedBy || '',
    createdBy: rewardPage?.createdBy || '',
    createdAt: rewardPage?.createdAt ? new Date(rewardPage.createdAt).getTime() : Date.now(),
    updatedAt: rewardPage?.updatedAt ? new Date(rewardPage.updatedAt).getTime() : Date.now(),
    fields: { ...rewardFields, contentOrder: [] } as any,
    customIconType: 'reward',
    subPages:
      rewardPage && reward && 'applications' in reward
        ? reward.applications
            .filter((application) => (members ? members[application.createdBy] : true))
            .map((application) =>
              mapApplicationToCard({
                application,
                rewardId: reward.id,
                spaceId,
                members
              })
            )
        : undefined
  };

  return card;
}

// build mock card from reward and page data
function mapApplicationToCard({
  application,
  rewardId,
  spaceId,
  members
}: {
  application: ApplicationMeta;
  rewardId: string;
  members?: Record<string, Member>;
  spaceId: string;
}) {
  const applicationFields = { properties: {} };

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

  const authorName = members?.[application.createdBy]?.username;
  const card: Card = {
    id: application.id || '',
    spaceId,
    parentId: rewardId,
    title: `Application ${authorName ? `from ${authorName}` : ''}`,
    rootId: spaceId,
    type: 'card' as const,
    customIconType: 'applicationStatus',
    updatedBy: application.createdBy || '',
    createdBy: application.createdBy || '',
    createdAt: application.createdAt ? new Date(application.createdAt).getTime() : 0,
    updatedAt: application.updatedAt ? new Date(application.updatedAt).getTime() : 0,
    fields: { ...applicationFields, contentOrder: [] }
  };

  return card;
}
