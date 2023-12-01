import type { BountyStatus } from '@charmverse/core/prisma-client';

import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { Constants } from 'lib/focalboard/constants';
import {
  ASSIGNEES_BLOCK_ID,
  REWARDS_AVAILABLE_BLOCK_ID,
  DUE_DATE_ID,
  REWARD_REVIEWERS_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID,
  CREATED_AT_ID,
  REWARD_AMOUNT,
  REWARD_CHAIN,
  REWARD_CUSTOM_VALUE,
  REWARD_TOKEN
} from 'lib/rewards/blocks/constants';

const rewardStatusOptions: { id: BountyStatus; value: string; color: keyof (typeof Constants)['menuColors'] }[] = [
  { id: 'open', value: 'Open', color: 'propColorTeal' },
  { id: 'inProgress', value: 'In Progress', color: 'propColorYellow' },
  { id: 'complete', value: 'Approved', color: 'propColorBlue' },
  { id: 'paid', value: 'Paid', color: 'propColorGreen' }
];

const rewardDbProperties = {
  rewardStatus: (): IPropertyTemplate => ({
    id: REWARD_STATUS_BLOCK_ID,
    name: 'Status',
    options: rewardStatusOptions,
    type: 'select'
  }),
  rewardAssignees: (): IPropertyTemplate => ({
    id: ASSIGNEES_BLOCK_ID,
    name: 'Assigned',
    options: [],
    type: 'person'
  }),
  rewardReviewers: (): IPropertyTemplate => ({
    id: REWARD_REVIEWERS_BLOCK_ID,
    name: 'Reviewers',
    options: [],
    type: 'person'
  }),
  rewardAvailableCount: (): IPropertyTemplate => ({
    id: REWARDS_AVAILABLE_BLOCK_ID,
    name: 'Available',
    options: [],
    type: 'number'
  }),
  rewardDueDate: (): IPropertyTemplate => ({
    id: DUE_DATE_ID,
    name: 'Due Date',
    options: [],
    type: 'date'
  }),
  rewardCreatedAt: (): IPropertyTemplate => ({
    id: CREATED_AT_ID,
    name: 'Created Time',
    options: [],
    type: 'createdTime'
  }),
  rewardAmount: (): IPropertyTemplate => ({
    id: REWARD_AMOUNT,
    name: 'Token amount',
    options: [],
    type: 'tokenAmount'
  }),
  rewardChain: (): IPropertyTemplate => ({
    id: REWARD_CHAIN,
    name: 'Token chain',
    options: [], // use an external list that can be maintained separately
    type: 'tokenChain'
  }),
  rewardCustomValue: (): IPropertyTemplate => ({
    id: REWARD_CUSTOM_VALUE,
    name: 'Custom reward',
    options: [],
    type: 'text'
  }),
  rewardToken: (): IPropertyTemplate => ({
    id: REWARD_TOKEN,
    name: 'Reward token',
    options: [],
    type: 'text'
  })
};

export function getDefaultRewardProperties(): IPropertyTemplate[] {
  return [
    rewardDbProperties.rewardCreatedAt(),
    rewardDbProperties.rewardDueDate(),
    rewardDbProperties.rewardAssignees(),
    rewardDbProperties.rewardReviewers(),
    rewardDbProperties.rewardAvailableCount(),
    rewardDbProperties.rewardStatus(),
    rewardDbProperties.rewardAmount(),
    rewardDbProperties.rewardChain(),
    rewardDbProperties.rewardCustomValue()
  ];
}
