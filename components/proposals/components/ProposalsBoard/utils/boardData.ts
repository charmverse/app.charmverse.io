import type { ProposalCategory } from '@charmverse/core/prisma';

import { Constants } from 'components/common/BoardEditor/focalboard/src/constants';
import { blockToFBBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { evaluationTypeOptions } from 'components/proposals/components/ProposalProperties/components/ProposalEvaluationTypeSelect';
import type { Block } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import { proposalDbProperties, proposalStatusBoardColors } from 'lib/focalboard/proposalDbProperties';
import { createTableView } from 'lib/focalboard/tableView';
import {
  AUTHORS_BLOCK_ID,
  CATEGORY_BLOCK_ID,
  CREATED_AT_ID,
  DEFAULT_BOARD_BLOCK_ID,
  DEFAULT_VIEW_BLOCK_ID,
  EVALUATION_TYPE_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  STATUS_BLOCK_ID
} from 'lib/proposal/blocks/constants';
import type { ProposalPropertiesBlock } from 'lib/proposal/blocks/interfaces';

const proposalStatuses = [
  'draft',
  'discussion',
  'review',
  'reviewed',
  'vote_active',
  'vote_closed',
  'evaluation_active',
  'evaluation_closed'
] as const;

export function getDefaultBoard({
  storedBoard,
  categories = [],
  customOnly = false
}: {
  storedBoard: ProposalPropertiesBlock | undefined;
  categories: ProposalCategory[] | undefined;
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

  const cardProperties = [...getDefaultProperties({ categories }), ...(block.fields?.cardProperties || [])];

  block.fields = {
    ...(block.fields || {}),
    cardProperties: customOnly ? cardProperties.filter((p) => !p.id.startsWith('__')) : cardProperties
  };

  const board = createBoard({
    block
  });

  return board;
}

function getDefaultProperties({ categories }: { categories: ProposalCategory[] | undefined }) {
  return [
    proposalDbProperties.proposalCreatedAt(CREATED_AT_ID, 'Created At'),
    getDefaultCategoryProperty(categories),
    getDefaultStatusProperty(),
    getDefaultEvaluationTypeProperty(),
    proposalDbProperties.proposalAuthor(AUTHORS_BLOCK_ID, 'Author'),
    proposalDbProperties.proposalReviewer(PROPOSAL_REVIEWERS_BLOCK_ID, 'Reviewer')
  ];
}

function getDefaultCategoryProperty(categories: ProposalCategory[] = []) {
  return {
    ...proposalDbProperties.proposalCategory(CATEGORY_BLOCK_ID, 'Category'),
    options: categories.map((c) => ({ id: c.id, value: c.title, color: c.color }))
  };
}

export function getDefaultStatusProperty() {
  return {
    ...proposalDbProperties.proposalCategory(STATUS_BLOCK_ID, 'Status'),
    options: proposalStatuses.map((s) => ({
      id: s,
      value: s,
      color: proposalStatusBoardColors[s]
    }))
  };
}

function getDefaultEvaluationTypeProperty() {
  return {
    ...proposalDbProperties.proposalCategory(EVALUATION_TYPE_BLOCK_ID, 'Type'),
    options: evaluationTypeOptions
  };
}

export function getDefaultTableView({
  storedBoard,
  categories = []
}: {
  storedBoard: ProposalPropertiesBlock | undefined;
  categories: ProposalCategory[] | undefined;
}) {
  const view = createTableView({
    board: getDefaultBoard({ storedBoard, categories })
  });

  view.id = DEFAULT_VIEW_BLOCK_ID;
  view.fields.columnWidths = {
    [Constants.titleColumnId]: 310,
    [CATEGORY_BLOCK_ID]: 200,
    [STATUS_BLOCK_ID]: 150,
    [AUTHORS_BLOCK_ID]: 150,
    [PROPOSAL_REVIEWERS_BLOCK_ID]: 150
  };

  // Default sorty by latest entries
  view.fields.sortOptions = [{ propertyId: CREATED_AT_ID, reversed: true }];

  // Hide createdAt by default
  view.fields.visiblePropertyIds = view.fields.visiblePropertyIds
    ? view.fields.visiblePropertyIds.filter((id) => id !== CREATED_AT_ID)
    : [];

  return view;
}
