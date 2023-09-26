import type { ApplicationStatus, BountyStatus } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import type { Constants } from 'components/common/BoardEditor/focalboard/src/constants';
import type { DatabaseRewardPropertyType, IPropertyTemplate } from 'lib/focalboard/board';

export const rewardDbProperties: {
  [key in DatabaseRewardPropertyType]: (id?: string, name?: string) => IPropertyTemplate<key>;
} = {
  rewardStatus: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Status',
    options: [],
    type: 'rewardStatus'
  }),
  rewardApplications: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Applications',
    options: [],
    type: 'rewardApplications'
  }),
  rewardReviewers: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Reviewers',
    options: [],
    type: 'rewardReviewers'
  }),
  rewardAvailableCount: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Available',
    options: [],
    type: 'rewardAvailableCount'
  }),
  rewardDueDate: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Due Date',
    options: [],
    type: 'rewardDueDate'
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
