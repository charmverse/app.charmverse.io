import { v4 } from 'uuid';

import { blockToFBBlock } from 'components/common/DatabaseEditor/utils/blockUtils';
import type { UIBlockWithDetails } from 'lib/databases/block';
import type { Board } from 'lib/databases/board';
import { createBoard } from 'lib/databases/board';
import { Constants } from 'lib/databases/constants';
import {
  EVALUATION_STATUS_LABELS,
  proposalDbProperties,
  proposalStatusColors
} from 'lib/databases/proposalDbProperties';
import { createTableView } from 'lib/databases/tableView';
import {
  AUTHORS_BLOCK_ID,
  CREATED_AT_ID,
  DEFAULT_BOARD_BLOCK_ID,
  DEFAULT_VIEW_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  PROPOSAL_STATUS_BLOCK_ID,
  PROPOSAL_STEP_BLOCK_ID
} from 'lib/proposals/blocks/constants';
import type { ProposalBoardBlock } from 'lib/proposals/blocks/interfaces';
import type { ProposalEvaluationStatus } from 'lib/proposals/interfaces';

const proposalStatuses = Object.keys(EVALUATION_STATUS_LABELS) as ProposalEvaluationStatus[];

export function getDefaultBoard({
  storedBoard,
  customOnly = false,
  evaluationStepTitles
}: {
  storedBoard?: ProposalBoardBlock | undefined;
  customOnly?: boolean;
  evaluationStepTitles: string[];
}) {
  const block: UIBlockWithDetails = storedBoard
    ? blockToFBBlock(storedBoard)
    : createBoard({
        block: {
          id: DEFAULT_BOARD_BLOCK_ID,
          fields: {
            cardProperties: []
          }
        }
      });

  const cardProperties = [...getDefaultProperties({ evaluationStepTitles }), ...(block.fields?.cardProperties || [])];

  block.fields = {
    ...(block.fields || {}),
    cardProperties: customOnly ? cardProperties.filter((p) => !p.id.startsWith('__')) : cardProperties
  };

  const board = createBoard({
    block
  });

  return board;
}

function getDefaultProperties({ evaluationStepTitles }: { evaluationStepTitles: string[] }) {
  return [
    getDefaultStepProperty({ evaluationStepTitles }),
    getDefaultStatusProperty(),
    proposalDbProperties.proposalAuthor({ name: 'Author' }),
    proposalDbProperties.proposalReviewer(),
    proposalDbProperties.proposalCreatedAt(),
    {
      id: `__createdTime`, // these properties are always re-generated so use a static id
      name: 'Last updated time',
      options: [],
      type: 'updatedTime'
    }
  ];
}

export function getDefaultStatusProperty() {
  return {
    ...proposalDbProperties.proposalStatus({ name: 'Status' }),
    options: proposalStatuses.map((s) => ({
      id: s,
      value: s,
      color: `propColor${proposalStatusColors[s].charAt(0).toUpperCase() + proposalStatusColors[s].slice(1)}`
    }))
  };
}

export function getDefaultStepProperty({ evaluationStepTitles }: { evaluationStepTitles: string[] }) {
  return {
    ...proposalDbProperties.proposalStep({ name: 'Step', options: ['Draft', ...evaluationStepTitles, 'Rewards'] })
  };
}

export function getDefaultTableView({ board }: { board: Board }) {
  const view = createTableView({ board });

  view.id = DEFAULT_VIEW_BLOCK_ID;
  const updatedTimeProperty = board.fields.cardProperties.find((p) => p.type === 'updatedTime');
  view.fields.columnWidths = {
    [Constants.titleColumnId]: 400,
    [PROPOSAL_STEP_BLOCK_ID]: 150,
    [PROPOSAL_STATUS_BLOCK_ID]: 150,
    [AUTHORS_BLOCK_ID]: 150,
    [PROPOSAL_REVIEWERS_BLOCK_ID]: 150,
    [updatedTimeProperty!.id]: 180
  };

  // Default sorty by latest entries
  view.fields.sortOptions = [{ propertyId: CREATED_AT_ID, reversed: true }];

  // Hide createdAt by default
  view.fields.visiblePropertyIds = view.fields.visiblePropertyIds.filter((id) => id !== CREATED_AT_ID);

  view.fields.openPageIn = 'full_page';

  // Add default filter to hide archived proposals
  if (!view.fields.filter.filters.length) {
    view.fields.filter.filters = [
      {
        condition: 'does_not_contain',
        filterId: v4(),
        operation: 'and',
        propertyId: PROPOSAL_STATUS_BLOCK_ID,
        values: ['archived']
      }
    ];
  }

  return view;
}
