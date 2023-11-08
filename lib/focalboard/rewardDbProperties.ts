import type { ApplicationStatus, BountyStatus } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import type { Constants } from 'components/common/BoardEditor/focalboard/src/constants';
import type { IPropertyTemplate } from 'lib/focalboard/board';

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
    options: [],
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
    type: 'select'
  }),
  rewardAvailableCount: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Available',
    options: [],
    type: 'text'
  }),
  rewardDueDate: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Due Date',
    options: [],
    type: 'date'
  }),
  rewardCreatedAt: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Created At',
    options: [],
    type: 'date'
  })
};

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
