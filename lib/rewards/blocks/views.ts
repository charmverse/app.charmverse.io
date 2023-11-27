import { getDefaultRewardProperties } from 'components/rewards/components/RewardsBoard/utils/getDefaultRewardProperties';
import { createBoardView } from 'lib/focalboard/boardView';
import { Constants } from 'lib/focalboard/constants';
import {
  DEFAULT_BOARD_BLOCK_ID,
  DEFAULT_BOARD_VIEW_BLOCK_ID,
  DEFAULT_CALENDAR_VIEW_BLOCK_ID,
  DEFAULT_TABLE_VIEW_BLOCK_ID
} from 'lib/focalboard/customBlocks/constants';
import {
  ASSIGNEES_BLOCK_ID,
  CREATED_AT_ID,
  DUE_DATE_ID,
  REWARDS_AVAILABLE_BLOCK_ID,
  REWARD_AMOUNT,
  REWARD_CHAIN,
  REWARD_CUSTOM_VALUE,
  REWARD_REVIEWERS_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID
} from 'lib/rewards/blocks/constants';

export function generateDefaultCalendarView({
  spaceId,
  dateDisplayPropertyId = DUE_DATE_ID
}: {
  spaceId: string;
  dateDisplayPropertyId?: string;
}) {
  const view = createBoardView();
  view.title = '';
  view.fields.viewType = 'calendar';
  view.id = DEFAULT_CALENDAR_VIEW_BLOCK_ID;
  view.parentId = DEFAULT_BOARD_BLOCK_ID;
  view.rootId = spaceId;
  view.fields.visiblePropertyIds = [Constants.titleColumnId];
  view.fields.cardOrder = [];

  // default date property
  view.fields.dateDisplayPropertyId = dateDisplayPropertyId;

  return view;
}

export function generateDefaultBoardView({ spaceId }: { spaceId: string }) {
  const view = createBoardView();
  view.title = '';
  view.fields.viewType = 'board';
  view.id = DEFAULT_BOARD_VIEW_BLOCK_ID;
  view.parentId = DEFAULT_BOARD_BLOCK_ID;
  view.rootId = spaceId;
  view.fields.visiblePropertyIds = [Constants.titleColumnId];
  view.fields.cardOrder = [];

  return view;
}

export function generateDefaultTableView({ spaceId }: { spaceId: string }) {
  const view = createBoardView();
  view.title = '';
  view.fields.viewType = 'table';
  view.id = DEFAULT_TABLE_VIEW_BLOCK_ID;
  view.parentId = DEFAULT_BOARD_BLOCK_ID;
  view.rootId = spaceId;
  view.fields.visiblePropertyIds = [Constants.titleColumnId, ...getDefaultRewardProperties().map((p) => p.id)];
  view.fields.cardOrder = [];

  view.fields.columnWidths = {
    [Constants.titleColumnId]: 400,
    [DUE_DATE_ID]: 150,
    [ASSIGNEES_BLOCK_ID]: 200,
    [REWARD_REVIEWERS_BLOCK_ID]: 150,
    [REWARDS_AVAILABLE_BLOCK_ID]: 150,
    [REWARD_STATUS_BLOCK_ID]: 150,
    [REWARD_AMOUNT]: 150,
    [REWARD_CHAIN]: 150,
    [REWARD_CUSTOM_VALUE]: 150
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
