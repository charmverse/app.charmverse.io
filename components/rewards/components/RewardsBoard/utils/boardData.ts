import type { BountyStatus } from '@charmverse/core/prisma-client';
import { RPCList } from 'connectors/chains';

import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import type { Block } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { Constants } from 'lib/focalboard/constants';
import { DEFAULT_CALENDAR_VIEW_BLOCK_ID, DEFAULT_TABLE_VIEW_BLOCK_ID } from 'lib/focalboard/customBlocks/constants';
import {
  ASSIGNEES_BLOCK_ID,
  REWARDS_AVAILABLE_BLOCK_ID,
  DEFAULT_BOARD_BLOCK_ID,
  DUE_DATE_ID,
  REWARD_REVIEWERS_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID,
  CREATED_AT_ID,
  REWARD_AMOUNT,
  REWARD_CHAIN,
  REWARD_CUSTOM_VALUE,
  REWARD_TOKEN
} from 'lib/rewards/blocks/constants';
import type { RewardPropertiesBlock } from 'lib/rewards/blocks/interfaces';
import {
  generateDefaultBoardView,
  generateDefaultCalendarView,
  generateDefaultTableView
} from 'lib/rewards/blocks/views';

export const tokenChainOptions: IPropertyTemplate['options'] = RPCList.map((rpc) => ({
  id: rpc.chainId.toString(),
  value: rpc.chainName,
  color: ''
}));

export function getDefaultBoard({
  storedBoard,
  customOnly = false
}: {
  storedBoard: RewardPropertiesBlock | undefined;
  customOnly?: boolean;
}) {
  const block: Partial<Block> = storedBoard
    ? blockToFBBlock(storedBoard)
    : createBoard({
        block: {
          id: DEFAULT_BOARD_BLOCK_ID,
          fields: {
            cardProperties: [],
            viewIds: [DEFAULT_TABLE_VIEW_BLOCK_ID, DEFAULT_BOARD_BLOCK_ID, DEFAULT_CALENDAR_VIEW_BLOCK_ID]
          }
        }
      });

  const cardProperties = [...getDefaultRewardProperties(), ...(block.fields?.cardProperties || [])];

  block.fields = {
    ...(block.fields || {}),
    cardProperties: customOnly ? cardProperties.filter((p) => !p.id.startsWith('__')) : cardProperties
  };

  const board = createBoard({
    block
  });

  return board;
}

export function getDefaultView({ viewType, spaceId }: { viewType: string; spaceId: string }) {
  if (viewType === 'board') {
    return generateDefaultBoardView({ spaceId });
  }

  if (viewType === 'calendar') {
    return generateDefaultCalendarView({ spaceId });
  }

  // default to table view
  return generateDefaultTableView({ spaceId });
}

const rewardStatusOptions: { id: BountyStatus; value: string; color: keyof (typeof Constants)['menuColors'] }[] = [
  { id: 'open', value: 'Open', color: 'propColorTeal' },
  { id: 'inProgress', value: 'In Progress', color: 'propColorYellow' },
  { id: 'complete', value: 'Complete', color: 'propColorPink' },
  { id: 'paid', value: 'Paid', color: 'propColorGray' }
];

const rewardDbProperties = {
  rewardStatus: (): IPropertyTemplate => ({
    id: REWARD_STATUS_BLOCK_ID,
    name: 'Status',
    options: rewardStatusOptions,
    type: 'select'
  }),
  rewardAssignees: (): IPropertyTemplate => ({
    id: ASSIGNEES_BLOCK_ID,
    name: 'Assigned',
    options: [],
    type: 'person'
  }),
  rewardReviewers: (): IPropertyTemplate => ({
    id: REWARD_REVIEWERS_BLOCK_ID,
    name: 'Reviewers',
    options: [],
    type: 'person'
  }),
  rewardAvailableCount: (): IPropertyTemplate => ({
    id: REWARDS_AVAILABLE_BLOCK_ID,
    name: 'Available',
    options: [],
    type: 'number'
  }),
  rewardDueDate: (): IPropertyTemplate => ({
    id: DUE_DATE_ID,
    name: 'Due Date',
    options: [],
    type: 'date'
  }),
  rewardCreatedAt: (): IPropertyTemplate => ({
    id: CREATED_AT_ID,
    name: 'Created Time',
    options: [],
    type: 'createdTime'
  }),
  rewardAmount: (): IPropertyTemplate => ({
    id: REWARD_AMOUNT,
    name: 'Token amount',
    options: [],
    type: 'tokenAmount'
  }),
  rewardChain: (): IPropertyTemplate => ({
    id: REWARD_CHAIN,
    name: 'Token chain',
    options: [], // use an external list that can be maintained separately
    type: 'tokenChain'
  }),
  rewardCustomValue: (): IPropertyTemplate => ({
    id: REWARD_CUSTOM_VALUE,
    name: 'Custom reward',
    options: [],
    type: 'text'
  }),
  rewardToken: (): IPropertyTemplate => ({
    id: REWARD_TOKEN,
    name: 'Reward token',
    options: [],
    type: 'text'
  })
};

export function getDefaultRewardProperties(): IPropertyTemplate[] {
  return [
    rewardDbProperties.rewardCreatedAt(),
    rewardDbProperties.rewardDueDate(),
    rewardDbProperties.rewardAssignees(),
    rewardDbProperties.rewardReviewers(),
    rewardDbProperties.rewardAvailableCount(),
    rewardDbProperties.rewardStatus(),
    rewardDbProperties.rewardAmount(),
    rewardDbProperties.rewardChain(),
    rewardDbProperties.rewardCustomValue()
  ];
}
