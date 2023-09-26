import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import type { Block } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import { rewardAndApplicationStatusBoardColors, rewardDbProperties } from 'lib/focalboard/rewardDbProperties';
import { createTableView } from 'lib/focalboard/tableView';
import {
  APPLICATIONS_BLOCK_ID,
  AVAILABLE_BLOCK_ID,
  DEFAULT_BOARD_BLOCK_ID,
  DEFAULT_VIEW_BLOCK_ID,
  DUE_DATE_ID,
  REVIEWERS_BLOCK_ID,
  STATUS_BLOCK_ID,
  TITLE_BLOCK_ID
} from 'lib/rewards/blocks/constants';
import type { RewardPropertiesBlock } from 'lib/rewards/blocks/interfaces';

const rewardStatuses = [] as const;

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

  const cardProperties = [...(block.fields?.cardProperties || []), ...getDefaultProperties()];

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
    getDefaultStatusProperty(),
    rewardDbProperties.rewardAvailableCount(AVAILABLE_BLOCK_ID, 'Available'),
    rewardDbProperties.rewardDueDate(DUE_DATE_ID, 'Due Date'),
    rewardDbProperties.rewardReviewers(REVIEWERS_BLOCK_ID, 'Reviewer')
  ];
}
export function getDefaultStatusProperty() {
  return {
    ...rewardDbProperties.rewardStatus(STATUS_BLOCK_ID, 'Status'),
    options: rewardStatuses.map((s) => ({
      id: s,
      value: s,
      color: rewardAndApplicationStatusBoardColors[s]
    }))
  };
}
export function getDefaultTableView({ storedBoard }: { storedBoard: RewardPropertiesBlock | undefined }) {
  const view = createTableView({
    board: getDefaultBoard({ storedBoard })
  });

  view.id = DEFAULT_VIEW_BLOCK_ID;
  view.fields.columnWidths = {
    [TITLE_BLOCK_ID]: 310,
    [DUE_DATE_ID]: 150,
    [APPLICATIONS_BLOCK_ID]: 200,
    [REVIEWERS_BLOCK_ID]: 150,
    [AVAILABLE_BLOCK_ID]: 150,
    [STATUS_BLOCK_ID]: 150
  };

  return view;
}
