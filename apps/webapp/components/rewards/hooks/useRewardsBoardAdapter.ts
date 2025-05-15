import type { PageMeta } from '@charmverse/core/pages';
import type { BoardView, IViewType } from '@packages/databases/boardView';
import type { Card, CardWithRelations } from '@packages/databases/card';
import { CardFilter } from '@packages/databases/cardFilter';
import { Constants } from '@packages/databases/constants';
import { viewTypeToBlockId } from '@packages/databases/customBlocks/constants';
import { sortCards } from '@packages/databases/store/cards';
import { blockToFBBlock } from '@packages/databases/utils/blockUtils';
import type { Member } from '@packages/lib/members/interfaces';
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
  REWARD_PROPOSAL_LINK,
  APPLICANT_STATUS_BLOCK_ID
} from '@packages/lib/rewards/blocks/constants';
import type { RewardFields } from '@packages/lib/rewards/blocks/interfaces';
import { getDefaultView } from '@packages/lib/rewards/blocks/views';
import { countRemainingSubmissionSlots } from '@packages/lib/rewards/countRemainingSubmissionSlots';
import type { ApplicationMeta, RewardWithUsers } from '@packages/lib/rewards/interfaces';
import { getAbsolutePath } from '@packages/lib/utils/browser';
import { isUUID } from '@packages/utils/strings';
import { isTruthy } from '@packages/utils/types';
import { useMemo } from 'react';

import { useRewardBlocks } from 'components/rewards/hooks/useRewardBlocks';
import { useRewardPage } from 'components/rewards/hooks/useRewardPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useMembers } from 'hooks/useMembers';

export type BoardReward = { id?: string; fields: RewardFields; sourceProposalPage?: string };

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
    let cards: CardWithRelations[] = (rewards || [])
      .map((reward) => {
        const page = getRewardPage(reward.id);
        if (!page || !space) return null;
        return {
          ...mapRewardToCard({
            reward,
            spaceId: space.id,
            spaceDomain: space.domain,
            rewardPage: page,
            members: membersRecord,
            isSubmissionSource: activeView.fields.sourceType === 'reward_applications'
          }),
          reward: {
            id: reward.id,
            rewardType: reward.rewardType,
            applications: reward.applications.map((app) => ({ createdBy: app.createdBy }))
          }
        };
      })
      .filter(isTruthy);

    const _applications = cards
      .map((card) => {
        return card.subPages || [];
      })
      .flat();

    if (activeView.fields.sourceType === 'reward_applications') {
      cards = _applications;
    }

    const filter = localViewSettings?.localFilters || activeView?.fields.filter;
    // filter cards by active view filter
    if (filter && board) {
      const filteredCards = CardFilter.applyFilterGroup(filter, board.fields.cardProperties, cards);

      cards = filteredCards;
    }
    const sortedCardPages = board
      ? sortCards(cards, board, activeView, membersRecord, {}, localViewSettings?.localSort)
      : [];

    return sortedCardPages;
  }, [
    activeView.fields.sortOptions,
    activeView?.fields.filter,
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

type RewardProps =
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

// build mock card from reward and page data
export function mapRewardToCard({
  reward,
  rewardPage,
  spaceId,
  spaceDomain,
  members,
  isSubmissionSource
}: {
  reward: RewardProps;
  rewardPage?: Pick<
    PageMeta,
    'id' | 'createdAt' | 'createdBy' | 'title' | 'path' | 'updatedBy' | 'updatedAt' | 'galleryImage'
  >;
  spaceId: string;
  spaceDomain: string;
  members?: Record<string, Member>;
  isSubmissionSource?: boolean;
}): CardWithRelations {
  const rewardFields = (reward.fields || { properties: {} }) as RewardFields;
  const validApplications =
    reward && 'applications' in reward
      ? members
        ? reward.applications.filter((application) => members[application.createdBy])
        : reward.applications
      : [];

  const sourceProposalPage = (reward as RewardWithUsers).sourceProposalPage;
  const proposalLinkValue = sourceProposalPage
    ? [getAbsolutePath(`/${sourceProposalPage.id}`, spaceDomain), sourceProposalPage.title]
    : '';
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
    [REWARD_PROPOSAL_LINK]: proposalLinkValue,
    [APPLICANT_STATUS_BLOCK_ID]: ''
  };

  const card: CardWithRelations = {
    // use page id as card id - kanban board is based on usePages
    id: rewardPage?.id || '',
    spaceId,
    pageId: rewardPage?.id || '',
    title: rewardPage?.title || '',
    rootId: spaceId,
    type: 'card' as const,
    galleryImage: rewardPage?.galleryImage || '',
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
                pageTitle: rewardPage.title,
                reward,
                spaceId,
                spaceDomain,
                members,
                isSubmissionSource
              })
            )
        : undefined
  };

  return card;
}

// build mock card from reward and page data
function mapApplicationToCard({
  application,
  pageTitle,
  reward,
  spaceId,
  spaceDomain,
  members,
  isSubmissionSource
}: {
  application: ApplicationMeta;
  pageTitle?: string;
  galleryImage?: string | null;
  reward: RewardProps;
  members?: Record<string, Member>;
  spaceId: string;
  spaceDomain: string;
  isSubmissionSource?: boolean;
}) {
  const applicationFields = { properties: {} };
  const assignedSubmitters =
    reward && 'assignedSubmitters' in reward && reward.assignedSubmitters ? reward.assignedSubmitters : null;
  const isAssignedReward = !!assignedSubmitters && assignedSubmitters.length > 0;
  const validApplications =
    reward && 'applications' in reward
      ? members
        ? reward.applications.filter((_application) => members[_application.createdBy])
        : reward.applications
      : [];
  const sourceProposalPage = (reward as RewardWithUsers).sourceProposalPage;
  const proposalLinkValue = sourceProposalPage
    ? [getAbsolutePath(`/${sourceProposalPage.id}`, spaceDomain), sourceProposalPage.title]
    : '';

  const rewardCustomProperties: Record<string, any> = {};
  const rewardProperties = (reward.fields as RewardFields)?.properties ?? {};

  Object.keys(rewardProperties).forEach((rewardPropertyKey) => {
    if (isUUID(rewardPropertyKey)) {
      rewardCustomProperties[rewardPropertyKey] = rewardProperties[rewardPropertyKey];
    }
  });

  applicationFields.properties = {
    ...applicationFields.properties,
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
    // Reward status allows matching application by reward status - Hide in the front end
    [REWARD_STATUS_BLOCK_ID]: (reward && 'status' in reward && reward.status) || '',
    [REWARDS_APPLICANTS_BLOCK_ID]: (application && 'createdBy' in application && application.createdBy) || '',
    [APPLICANT_STATUS_BLOCK_ID]: (application && 'status' in application && application.status) || '',
    [REWARDER_BLOCK_ID]: (application && 'createdBy' in application && [application.createdBy]) || '',
    [DUE_DATE_ID]: reward && 'dueDate' in reward && reward.dueDate ? new Date(reward.dueDate).getTime() : '',
    [REWARD_REVIEWERS_BLOCK_ID]: (reward && 'reviewers' in reward && reward.reviewers) || [],
    [REWARD_APPLICANTS_COUNT]: isAssignedReward ? 1 : validApplications.length.toString(),
    [CREATED_AT_ID]:
      reward && 'createdAt' in reward && reward.createdAt ? new Date(reward.createdAt as string).getTime() : '',
    [REWARD_AMOUNT]: (reward && 'rewardAmount' in reward && reward.rewardAmount) || '',
    [REWARD_CHAIN]: (reward && 'chainId' in reward && reward.chainId?.toString()) || '',
    [REWARD_CUSTOM_VALUE]: (reward && 'customReward' in reward && reward.customReward) || '',
    [REWARD_TOKEN]: (reward && 'rewardToken' in reward && reward.rewardToken) || '',
    [REWARD_PROPOSAL_LINK]: proposalLinkValue,
    ...rewardCustomProperties
  };

  const isApplication =
    application.status === 'applied' || application.status === 'inProgress' || application.status === 'rejected';

  const authorName = members?.[application.createdBy]?.username;
  const card: Card = {
    id: application.id || '',
    spaceId,
    parentId: reward.id,
    title: isSubmissionSource
      ? pageTitle || 'Untitled'
      : `${isApplication ? 'Application' : 'Submission'} ${authorName ? `from ${authorName}` : ''}`,
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
