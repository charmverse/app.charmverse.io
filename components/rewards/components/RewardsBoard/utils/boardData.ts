import type { BountyStatus } from '@charmverse/core/prisma-client';

import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import type { Block } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { Constants } from 'lib/focalboard/constants';
import { createTableView } from 'lib/focalboard/tableView';
import {
  ASSIGNEES_BLOCK_ID,
  REWARDS_AVAILABLE_BLOCK_ID,
  DEFAULT_BOARD_BLOCK_ID,
  DEFAULT_VIEW_BLOCK_ID,
  DUE_DATE_ID,
  REWARD_REVIEWERS_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID,
  CREATED_AT_ID,
  REWARD_AMOUNT,
  REWARD_CHAIN,
  REWARD_CUSTOM_VALUE
} from 'lib/rewards/blocks/constants';
import type { RewardPropertiesBlock } from 'lib/rewards/blocks/interfaces';

export function getDefaultBoard({
  storedBoard,
  customOnly = false
}: {
  storedBoard: RewardPropertiesBlock | undefined;
  customOnly?: boolean;
}) {
  const block: Partial<Block> = storedBoard
    ? blockToFBBlock(storedBoard)
    : {
        id: DEFAULT_BOARD_BLOCK_ID,
        fields: {
          cardProperties: []
        }
      };

  const cardProperties = [...getDefaultProperties(), ...(block.fields?.cardProperties || [])];

  block.fields = {
    ...(block.fields || {}),
    cardProperties: customOnly ? cardProperties.filter((p) => !p.id.startsWith('__')) : cardProperties
  };

  const board = createBoard({
    block
  });

  return board;
}

export function getDefaultTableView({ storedBoard }: { storedBoard: RewardPropertiesBlock | undefined }) {
  const view = createTableView({
    board: getDefaultBoard({ storedBoard })
  });

  view.id = DEFAULT_VIEW_BLOCK_ID;
  view.fields.columnWidths = {
    [Constants.titleColumnId]: 400,
    [DUE_DATE_ID]: 150,
    [ASSIGNEES_BLOCK_ID]: 200,
    [REWARD_REVIEWERS_BLOCK_ID]: 150,
    [REWARDS_AVAILABLE_BLOCK_ID]: 150,
    [REWARD_STATUS_BLOCK_ID]: 150
  };

  // Wrap title comumn by default
  view.fields.columnWrappedIds = [Constants.titleColumnId];

  // Default sorty by latest entries
  view.fields.sortOptions = [{ propertyId: CREATED_AT_ID, reversed: true }];

  // Hide createdAt by default
  view.fields.visiblePropertyIds = view.fields.visiblePropertyIds
    ? view.fields.visiblePropertyIds.filter((id) => id !== CREATED_AT_ID)
    : [];

  return view;
}

const rewardStatusOptions: { id: BountyStatus; value: string; color: keyof (typeof Constants)['menuColors'] }[] = [
  { id: 'open', value: 'Open', color: 'propColorTeal' },
  { id: 'inProgress', value: 'In Progress', color: 'propColorYellow' },
  { id: 'complete', value: 'Complete', color: 'propColorPink' },
  { id: 'paid', value: 'Paid', color: 'propColorGray' },
  { id: 'suggestion', value: 'Suggestion', color: 'propColorPurple' }
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
    name: 'Amount',
    options: [],
    type: 'token_amount'
  }),
  rewardChain: (): IPropertyTemplate => ({
    id: REWARD_CHAIN,
    name: 'Chain',
    options: [],
    type: 'token_chain'
  }),
  rewardCustomValue: (): IPropertyTemplate => ({
    id: REWARD_CUSTOM_VALUE,
    name: 'Custom reward',
    options: [],
    type: 'text'
  })
};

function getDefaultProperties(): IPropertyTemplate[] {
  return [
    rewardDbProperties.rewardCreatedAt(),
    rewardDbProperties.rewardDueDate(),
    rewardDbProperties.rewardAssignees(),
    rewardDbProperties.rewardReviewers(),
    rewardDbProperties.rewardAvailableCount(),
    rewardDbProperties.rewardStatus(),
    rewardDbProperties.rewardChain(),
    rewardDbProperties.rewardAmount(),
    rewardDbProperties.rewardCustomValue()
  ];
}
