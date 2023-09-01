import type { ProposalCategory } from '@charmverse/core/prisma';

import { evaluationTypeOptions } from 'components/proposals/components/ProposalProperties/components/ProposalEvaluationTypeSelect';
import { createBoard, type IPropertyTemplate } from 'lib/focalboard/board';
import { proposalDbProperties, proposalStatusBoardColors } from 'lib/focalboard/proposalDbProperties';
import { createTableView } from 'lib/focalboard/tableView';

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
      id: '__defaultBoard',
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
    proposalDbProperties.proposalAuthor('__authors', 'Author'),
    proposalDbProperties.proposalReviewer('__reviewers', 'Reviewer')
  ];
}

function getDefaultCategoryProperty(categories: ProposalCategory[] = []) {
  return {
    ...proposalDbProperties.proposalCategory('__category', 'Category'),
    options: categories.map((c) => ({ id: c.id, value: c.title, color: c.color }))
  };
}

export function getDefaultStatusProperty() {
  return {
    ...proposalDbProperties.proposalCategory('__status', 'Status'),
    options: proposalStatuses.map((s) => ({
      id: s,
      value: s,
      color: proposalStatusBoardColors[s]
    }))
  };
}

function getDefaultEvaluationTypeProperty() {
  return {
    ...proposalDbProperties.proposalCategory('__evaluationType', 'Type'),
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

  view.id = '__defaultView';
  view.fields.columnWidths = {
    __title: 310,
    __category: 200,
    __status: 150,
    __authors: 150,
    __reviewers: 150
  };

  return view;
}
