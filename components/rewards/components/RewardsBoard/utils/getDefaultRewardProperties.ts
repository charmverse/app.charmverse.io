import type { BountyStatus } from '@charmverse/core/prisma-client';

import type { IPropertyTemplate } from 'lib/databases/board';
import type { Constants } from 'lib/databases/constants';
import {
  REWARDS_APPLICANTS_BLOCK_ID,
  REWARDS_AVAILABLE_BLOCK_ID,
  DUE_DATE_ID,
  REWARD_REVIEWERS_BLOCK_ID,
  REWARD_STATUS_BLOCK_ID,
  CREATED_AT_ID,
  REWARD_AMOUNT,
  REWARD_CHAIN,
  REWARD_CUSTOM_VALUE,
  REWARD_TOKEN,
  REWARD_APPLICANTS_COUNT,
  REWARD_PROPOSAL_LINK
} from 'lib/rewards/blocks/constants';

// define properties that will apply to all source fields
const defaultOptions = { readOnly: true, options: [] };

const rewardStatusOptions: { id: BountyStatus; value: string; color: keyof (typeof Constants)['menuColors'] }[] = [
  { id: 'open', value: 'Open', color: 'propColorTeal' },
  { id: 'complete', value: 'Approved', color: 'propColorBlue' },
  { id: 'paid', value: 'Paid', color: 'propColorGreen' }
];

const rewardDbProperties = {
  rewardStatus: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: REWARD_STATUS_BLOCK_ID,
    name: 'Status',
    options: rewardStatusOptions,
    type: 'select'
  }),
  rewardApplicants: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: REWARDS_APPLICANTS_BLOCK_ID,
    name: 'Applicant',
    type: 'person'
  }),
  rewardReviewers: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: REWARD_REVIEWERS_BLOCK_ID,
    name: 'Reviewers',
    type: 'person'
  }),
  rewardAvailableCount: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: REWARDS_AVAILABLE_BLOCK_ID,
    name: 'Available',
    type: 'number'
  }),
  rewardDueDate: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: DUE_DATE_ID,
    name: 'Due Date',
    type: 'date'
  }),
  rewardCreatedAt: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: CREATED_AT_ID,
    name: 'Created Time',
    type: 'createdTime'
  }),
  rewardAmount: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: REWARD_AMOUNT,
    name: 'Token amount',
    type: 'tokenAmount'
  }),
  rewardChain: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: REWARD_CHAIN,
    name: 'Token chain',
    options: [], // use an external list that can be maintained separately
    type: 'tokenChain'
  }),
  rewardCustomValue: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: REWARD_CUSTOM_VALUE,
    name: 'Custom reward',
    type: 'text'
  }),
  rewardToken: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: REWARD_TOKEN,
    name: 'Reward token',
    type: 'text'
  }),
  rewardApplicantsNumber: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: REWARD_APPLICANTS_COUNT,
    name: 'No. of Applicants',
    type: 'number'
  }),
  rewardProposalLink: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: REWARD_PROPOSAL_LINK,
    name: 'Proposal',
    type: 'proposalUrl'
  })
};

export function getDefaultRewardProperties(hasMilestoneRewards?: boolean): IPropertyTemplate[] {
  const properties = [
    rewardDbProperties.rewardCreatedAt(),
    rewardDbProperties.rewardDueDate(),
    rewardDbProperties.rewardApplicants(),
    rewardDbProperties.rewardReviewers(),
    rewardDbProperties.rewardAvailableCount(),
    rewardDbProperties.rewardStatus(),
    rewardDbProperties.rewardAmount(),
    rewardDbProperties.rewardChain(),
    rewardDbProperties.rewardCustomValue(),
    rewardDbProperties.rewardApplicantsNumber()
  ];

  if (hasMilestoneRewards) {
    properties.unshift(rewardDbProperties.rewardProposalLink());
  }

  return properties;
}
