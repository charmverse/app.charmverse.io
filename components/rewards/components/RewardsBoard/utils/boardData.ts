import { Constants } from 'components/common/BoardEditor/focalboard/src/constants';
import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import type { Block } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import { rewardAndApplicationStatusBoardColors, rewardDbProperties } from 'lib/focalboard/rewardDbProperties';
import { createTableView } from 'lib/focalboard/tableView';
import {
  ASSIGNEES_BLOCK_ID,
  REWARDS_AVAILABLE_BLOCK_ID,
  DEFAULT_BOARD_BLOCK_ID,
  DEFAULT_VIEW_BLOCK_ID,
  DUE_DATE_ID,
  REWARD_REVIEWERS_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID
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

function getDefaultProperties() {
  return [
    rewardDbProperties.rewardDueDate(DUE_DATE_ID, 'Due Date'),
    rewardDbProperties.rewardAssignees(ASSIGNEES_BLOCK_ID, 'Assigned'),
    rewardDbProperties.rewardReviewers(REWARD_REVIEWERS_BLOCK_ID, 'Reviewer'),
    rewardDbProperties.rewardAvailableCount(REWARDS_AVAILABLE_BLOCK_ID, 'Available'),
    rewardDbProperties.rewardStatus(REWARD_STATUS_BLOCK_ID, 'Status')
  ];
}

export function getDefaultTableView({ storedBoard }: { storedBoard: RewardPropertiesBlock | undefined }) {
  const view = createTableView({
    board: getDefaultBoard({ storedBoard })
  });

  view.id = DEFAULT_VIEW_BLOCK_ID;
  view.fields.columnWidths = {
    [Constants.titleColumnId]: 310,
    [DUE_DATE_ID]: 150,
    [ASSIGNEES_BLOCK_ID]: 200,
    [REWARD_REVIEWERS_BLOCK_ID]: 150,
    [REWARDS_AVAILABLE_BLOCK_ID]: 150,
    [REWARD_STATUS_BLOCK_ID]: 150
  };

  // Wrap title comumn by default
  view.fields.columnWrappedIds = [Constants.titleColumnId];

  return view;
}
