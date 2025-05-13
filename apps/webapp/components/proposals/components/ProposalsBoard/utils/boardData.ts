import { v4 } from 'uuid';

import { blockToFBBlock } from 'components/common/DatabaseEditor/utils/blockUtils';
import type { UIBlockWithDetails } from '@packages/databases/block';
import type { Board } from '@packages/databases/board';
import { createBoard } from '@packages/databases/board';
import { Constants } from '@packages/databases/constants';
import {
  EVALUATION_STATUS_LABELS,
  proposalDbProperties,
  proposalStatusColors
} from '@packages/databases/proposalDbProperties';
import { createTableView } from '@packages/databases/tableView';
import {
  AUTHORS_BLOCK_ID,
  CREATED_AT_ID,
  DEFAULT_BOARD_BLOCK_ID,
  DEFAULT_VIEW_BLOCK_ID,
  PROPOSAL_EVALUATION_DUE_DATE_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  PROPOSAL_STATUS_BLOCK_ID,
  PROPOSAL_STEP_BLOCK_ID
} from '@packages/lib/proposals/blocks/constants';
import type { ProposalBoardBlock } from '@packages/lib/proposals/blocks/interfaces';
import type { ProposalEvaluationStatus } from '@packages/lib/proposals/interfaces';

const proposalStatuses = Object.keys(EVALUATION_STATUS_LABELS) as ProposalEvaluationStatus[];

// define properties that will apply to all source fields
const defaultOptions = { readOnly: true, options: [] };

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

// NOTE: All properties should have a static id beginning with "__" to avoid conflicts with user-defined properties
function getDefaultProperties({ evaluationStepTitles }: { evaluationStepTitles: string[] }) {
  const properties = [
    getDefaultStepProperty({ evaluationStepTitles }),
    getDefaultStatusProperty(),
    {
      ...defaultOptions,
      ...proposalDbProperties.proposalAuthor({ name: 'Author' })
    },
    { ...defaultOptions, ...proposalDbProperties.proposalReviewer() },
    getPublishedAtProperty(),
    getDefaultEvaluationDueDateProperty(),
    { ...defaultOptions, ...proposalDbProperties.proposalCreatedAt() },
    {
      ...defaultOptions,
      id: `__createdTime`, // these properties are always re-generated so use a static id
      name: 'Last updated time',
      type: 'updatedTime'
    }
  ];
  if (properties.some((prop) => !prop.id.startsWith('__'))) {
    throw new Error('All default properties should have a static id beginning with "__"');
  }
  return properties;
}

export function getDefaultStatusProperty() {
  return {
    ...defaultOptions,
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
    ...defaultOptions,
    ...proposalDbProperties.proposalStep({
      name: 'Step',
      options: ['Draft', ...evaluationStepTitles, 'Rewards', 'Credentials']
    })
  };
}

export function getPublishedAtProperty() {
  return {
    ...defaultOptions,
    ...proposalDbProperties.proposalPublishedAt({
      name: 'Publish date'
    })
  };
}

export function getDefaultEvaluationDueDateProperty() {
  return {
    ...defaultOptions,
    ...proposalDbProperties.proposalEvaluationDueDate({
      name: 'Due Date'
    })
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
    [PROPOSAL_EVALUATION_DUE_DATE_ID]: 150,
    [updatedTimeProperty!.id]: 180
  };

  // Default sorty by latest entries
  view.fields.sortOptions = [{ propertyId: CREATED_AT_ID, reversed: true }];

  // Hide createdAt by default
  view.fields.visiblePropertyIds = view.fields.visiblePropertyIds.filter((id) => id !== CREATED_AT_ID);
  // make sure title is first. otherwise when it is renmed, it will appear after the other default proposal card properties
  view.fields.visiblePropertyIds = [
    Constants.titleColumnId,
    ...view.fields.visiblePropertyIds.filter((prop) => prop !== Constants.titleColumnId)
  ];

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
