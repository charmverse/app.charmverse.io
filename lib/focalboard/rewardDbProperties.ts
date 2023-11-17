import type { ApplicationStatus, BountyStatus } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { Constants } from 'lib/focalboard/constants';

/**
 * See components/rewards/components/RewardStatusBadge.tsx // RewardStatusColors for the corresponding statuses
 */

export const rewardStatusBoardColors: Record<BountyStatus, keyof (typeof Constants)['menuColors']> = {
  open: 'propColorTeal',
  suggestion: 'propColorPurple',
  inProgress: 'propColorYellow',
  complete: 'propColorPink',
  paid: 'propColorGray'
};

export const applicationStatusBoardColors: Record<ApplicationStatus, keyof (typeof Constants)['menuColors']> = {
  applied: 'propColorTeal',
  cancelled: 'propColorGray',
  complete: 'propColorGray',
  inProgress: 'propColorGreen',
  rejected: 'propColorRed',
  submission_rejected: 'propColorRed',
  paid: 'propColorGray',
  processing: 'propColorPink',
  review: 'propColorYellow'
};

export const rewardAndApplicationStatusBoardColors: Record<
  BountyStatus | ApplicationStatus,
  keyof (typeof Constants)['menuColors']
> = {
  ...rewardStatusBoardColors,
  ...applicationStatusBoardColors
};
export const rewardStatusOptions = [
  { id: 'open', value: 'Open', color: rewardStatusBoardColors.open },
  { id: 'inProgress', value: 'In Progress', color: rewardStatusBoardColors.inProgress },
  { id: 'complete', value: 'Complete', color: rewardStatusBoardColors.complete },
  { id: 'paid', value: 'Paid', color: rewardStatusBoardColors.paid },
  { id: 'suggestion', value: 'Suggestion', color: rewardStatusBoardColors.suggestion }
];
const rewardPropertyTypesList = [
  'rewardStatus',
  'rewardAssignees',
  'rewardReviewers',
  'rewardAvailableCount',
  'rewardDueDate',
  'rewardCreatedAt'
] as const;
type DatabaseRewardPropertyType = (typeof rewardPropertyTypesList)[number];

export const rewardDbProperties: {
  [key in DatabaseRewardPropertyType]: (id?: string, name?: string) => IPropertyTemplate;
} = {
  rewardStatus: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Status',
    options: rewardStatusOptions,
    type: 'select'
  }),
  rewardAssignees: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Assigned',
    options: [],
    type: 'person'
  }),
  rewardReviewers: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Reviewers',
    options: [],
    type: 'person'
  }),
  rewardAvailableCount: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Available',
    options: [],
    type: 'number'
  }),
  rewardDueDate: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Due Date',
    options: [],
    type: 'date'
  }),
  rewardCreatedAt: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Created Time',
    options: [],
    type: 'createdTime'
  })
};
