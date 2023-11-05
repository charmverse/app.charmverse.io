import { v4 as uuid } from 'uuid';

import type { Constants } from 'components/common/BoardEditor/focalboard/src/constants';
import type { DatabaseProposalPropertyType, IPropertyTemplate } from 'lib/focalboard/board';
import type { ProposalStatusWithArchived } from 'lib/proposal/proposalStatusTransition';

export const proposalDbProperties: {
  [key in DatabaseProposalPropertyType]: (id?: string, name?: string) => IPropertyTemplate<key>;
} = {
  proposalCategory: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Category',
    options: [],
    type: 'proposalCategory'
  }),
  proposalStatus: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Status',
    options: [],
    type: 'proposalStatus'
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
  evaluation_closed: 'propColorPink'
};
