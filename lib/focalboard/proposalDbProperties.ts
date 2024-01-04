import type { ProposalEvaluationType } from '@charmverse/core/dist/cjs/prisma-client';
import { v4 as uuid } from 'uuid';

import type { DatabaseProposalPropertyType, IPropertyTemplate } from 'lib/focalboard/board';
import type { Constants } from 'lib/focalboard/constants';
import type { ProposalStatusWithArchived } from 'lib/proposal/proposalStatusTransition';

export const proposalDbProperties: {
  [key in DatabaseProposalPropertyType]: (id?: string, name?: string) => IPropertyTemplate;
} = {
  proposalStatus: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Status',
    options: [],
    type: 'proposalStatus'
  }),
  proposalStep: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Step',
    options: [],
    type: 'proposalStep'
  }),
  proposalUrl: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Url',
    options: [],
    type: 'proposalUrl'
  }),
  proposalEvaluatedBy: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Evaluated By',
    options: [],
    type: 'proposalEvaluatedBy'
  }),
  proposalEvaluationAverage: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Evaluation Average',
    options: [],
    type: 'proposalEvaluationAverage'
  }),
  proposalEvaluationTotal: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Evaluation Total',
    options: [],
    type: 'proposalEvaluationTotal'
  }),
  proposalAuthor: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Authors',
    options: [],
    type: 'proposalAuthor'
  }),
  proposalReviewer: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Reviewers',
    options: [],
    type: 'proposalReviewer'
  }),
  proposalEvaluationType: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Type',
    options: [],
    type: 'proposalEvaluationType'
  }),
  proposalCreatedAt: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Created Time',
    options: [],
    type: 'createdTime'
  })
};

/**
 * See components/proposals/components/ProposalStatusBadge.tsx // ProposalStatusColors for the corresponding statuses
 */

export const proposalStatusBoardColors: Record<ProposalStatusWithArchived, keyof (typeof Constants)['menuColors']> = {
  archived: 'propColorGray',
  draft: 'propColorGray',
  discussion: 'propColorTeal',
  review: 'propColorYellow',
  reviewed: 'propColorPurple',
  vote_active: 'propColorPink',
  vote_closed: 'propColorRed',
  evaluation_active: 'propColorRed',
  evaluation_closed: 'propColorPink',
  published: 'propColorGreen'
};

export const proposalStepBoardColors: Record<ProposalEvaluationType, keyof (typeof Constants)['menuColors']> = {
  feedback: 'propColorGray',
  pass_fail: 'propColorGray',
  rubric: 'propColorGray',
  vote: 'propColorGray'
};
