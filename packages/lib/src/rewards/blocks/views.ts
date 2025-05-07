import type { UIBlockWithDetails as FBBlock } from '@packages/databases/block';
import type { IViewType } from '@packages/databases/boardView';
import { createBoardView } from '@packages/databases/boardView';
import { Constants } from '@packages/databases/constants';
import {
  DEFAULT_BOARD_BLOCK_ID,
  DEFAULT_BOARD_VIEW_BLOCK_ID,
  DEFAULT_CALENDAR_VIEW_BLOCK_ID,
  DEFAULT_TABLE_VIEW_BLOCK_ID
} from '@packages/databases/customBlocks/constants';
import type { RewardType } from '@packages/lib/rewards/interfaces';
import { v4 as uuid } from 'uuid';

import { getDefaultRewardProperties } from 'components/rewards/components/RewardsBoard/utils/getDefaultRewardProperties';

import {
  REWARDS_APPLICANTS_BLOCK_ID,
  CREATED_AT_ID,
  DUE_DATE_ID,
  REWARDS_AVAILABLE_BLOCK_ID,
  REWARD_AMOUNT,
  REWARD_CHAIN,
  REWARD_CUSTOM_VALUE,
  REWARD_REVIEWERS_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID,
  REWARD_APPLICANTS_COUNT,
  APPLICANT_STATUS_BLOCK_ID
} from './constants';

export const defaultRewardViews = [DEFAULT_TABLE_VIEW_BLOCK_ID, DEFAULT_BOARD_VIEW_BLOCK_ID];

export const supportedRewardViewTypes: IViewType[] = ['calendar', 'board', 'table', 'gallery'];

export function getDefaultView({ spaceId }: { spaceId?: string }) {
  // default to table view
  return generateDefaultTableView({ spaceId });
}

export function generateDefaultCalendarView({
  spaceId,
  dateDisplayPropertyId = DUE_DATE_ID
}: {
  spaceId?: string;
  dateDisplayPropertyId?: string;
}) {
  const view = createBoardView();
  view.title = '';
  view.fields.viewType = 'calendar';
  view.id = DEFAULT_CALENDAR_VIEW_BLOCK_ID;
  view.parentId = DEFAULT_BOARD_BLOCK_ID;
  view.rootId = spaceId || uuid();
  view.fields.visiblePropertyIds = [Constants.titleColumnId, REWARD_AMOUNT];
  view.fields.cardOrder = [];

  // default date property
  view.fields.dateDisplayPropertyId = dateDisplayPropertyId;

  return view;
}

export function generateDefaultBoardView({
  spaceId,
  block
}: {
  spaceId?: string;
  block?: Pick<FBBlock, 'fields'> & Partial<Pick<FBBlock, 'title'>>;
}) {
  const view = createBoardView(block);
  view.title = block?.title ?? '';
  view.fields.viewType = 'board';
  view.id = DEFAULT_BOARD_VIEW_BLOCK_ID;
  view.parentId = DEFAULT_BOARD_BLOCK_ID;
  view.rootId = spaceId || uuid();
  view.fields.visiblePropertyIds = [Constants.titleColumnId, REWARD_AMOUNT, REWARD_APPLICANTS_COUNT];
  view.fields.cardOrder = [];

  return view;
}

export function generateDefaultTableView({
  spaceId,
  block
}: {
  spaceId?: string;
  block?: Pick<FBBlock, 'fields'> & Partial<Pick<FBBlock, 'title'>>;
}) {
  const view = createBoardView(block);
  view.title = block?.title ?? '';
  view.fields.viewType = 'table';
  view.id = DEFAULT_TABLE_VIEW_BLOCK_ID;
  view.parentId = DEFAULT_BOARD_BLOCK_ID;
  view.rootId = spaceId || uuid();
  view.fields.visiblePropertyIds = [Constants.titleColumnId, ...getDefaultRewardProperties().map((p) => p.id)];
  view.fields.cardOrder = [];

  view.fields.columnWidths = {
    [Constants.titleColumnId]: 400,
    [DUE_DATE_ID]: 150,
    [REWARDS_APPLICANTS_BLOCK_ID]: 200,
    [REWARD_REVIEWERS_BLOCK_ID]: 150,
    [REWARDS_AVAILABLE_BLOCK_ID]: 150,
    [REWARD_STATUS_BLOCK_ID]: 150,
    [REWARD_AMOUNT]: 150,
    [REWARD_CHAIN]: 150,
    [REWARD_CUSTOM_VALUE]: 150,
    [REWARD_APPLICANTS_COUNT]: 150,
    [APPLICANT_STATUS_BLOCK_ID]: 150
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

export function getProposalRewardsView({
  board,
  spaceId,
  rewardTypes
}: {
  board: FBBlock;
  spaceId?: string;
  includeStatus?: boolean;
  rewardTypes: RewardType[];
}) {
  const view = getDefaultView({ spaceId });

  const blockCreated = new Date(board.createdAt).toISOString();

  // all custom properties are visible by default
  view.fields.visiblePropertyIds = (board.fields.cardProperties as { id: string; deletedAt?: string }[])
    .filter((p) => !p.deletedAt || p.deletedAt > blockCreated)
    .map((p) => p.id)
    .filter((id: string) => {
      if (rewardTypes.includes('custom') && (id === REWARD_CUSTOM_VALUE || id === DUE_DATE_ID)) {
        return true;
      } else if (rewardTypes.includes('token') && (id === REWARD_AMOUNT || id === REWARD_CHAIN || id === DUE_DATE_ID)) {
        return true;
      } else {
        return !id.startsWith('__');
      }
    });

  view.fields.columnWidths = {
    ...view.fields.columnWidths,
    [Constants.titleColumnId]: 250
  };
  // set larger than normal width for all custom properties
  view.fields.visiblePropertyIds.forEach((id) => {
    if (!view.fields.columnWidths[id]) {
      view.fields.columnWidths[id] = 150;
    }
  });
  return view;
}
