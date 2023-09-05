import type { ProposalCategory } from '@charmverse/core/prisma';

import { evaluationTypeOptions } from 'components/proposals/components/ProposalProperties/components/ProposalEvaluationTypeSelect';
import { createBoard, type IPropertyTemplate } from 'lib/focalboard/board';
import { proposalDbProperties, proposalStatusBoardColors } from 'lib/focalboard/proposalDbProperties';
import { createTableView } from 'lib/focalboard/tableView';
import {
  AUTHORS_BLOCK_ID,
  CATEGORY_BLOCK_ID,
  DEFAULT_BOARD_ID,
  DEFAULT_VIEW_BLOCK_ID,
  EVALUATION_TYPE_BLOCK_ID,
  REVIEWERS_BLOCK_ID,
  STATUS_BLOCK_ID,
  TITLE_BLOCK_ID
} from 'lib/proposal/blocks/constants';

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
  properties = [],
  categories = [],
  customOnly = false
}: {
  properties: IPropertyTemplate[] | undefined;
  categories: ProposalCategory[] | undefined;
  customOnly?: boolean;
}) {
  const board = createBoard({
    block: {
      id: DEFAULT_BOARD_ID,
      fields: {
        cardProperties: [
          // additional mocked properties that are not being saved with ids starting with __
          ...(customOnly ? [] : getDefaultProperties({ categories })),
          ...properties
        ]
      }
    }
  });

  return board;
}

function getDefaultProperties({ categories }: { categories: ProposalCategory[] | undefined }) {
  return [
    getDefaultCategoryProperty(categories),
    getDefaultStatusProperty(),
    getDefaultEvaluationTypeProperty(),
    proposalDbProperties.proposalAuthor(AUTHORS_BLOCK_ID, 'Author'),
    proposalDbProperties.proposalReviewer(REVIEWERS_BLOCK_ID, 'Reviewer')
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
  properties = [],
  categories = []
}: {
  properties: IPropertyTemplate[] | undefined;
  categories: ProposalCategory[] | undefined;
}) {
  const view = createTableView({
    board: getDefaultBoard({ properties, categories })
  });

  view.id = DEFAULT_VIEW_BLOCK_ID;
  view.fields.columnWidths = {
    [TITLE_BLOCK_ID]: 310,
    [CATEGORY_BLOCK_ID]: 200,
    [STATUS_BLOCK_ID]: 150,
    [AUTHORS_BLOCK_ID]: 150,
    [REVIEWERS_BLOCK_ID]: 150
  };

  return view;
}
