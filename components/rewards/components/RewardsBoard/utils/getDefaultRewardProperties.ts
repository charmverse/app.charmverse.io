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

const rewardStatusOptions: { id: BountyStatus; value: string; color: keyof (typeof Constants)['menuColors'] }[] = [
  { id: 'open', value: 'Open', color: 'propColorTeal' },
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
  rewardApplicants: (): IPropertyTemplate => ({
    id: REWARDS_APPLICANTS_BLOCK_ID,
    name: 'Applicant',
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
  }),
  rewardApplicantsNumber: (): IPropertyTemplate => ({
    id: REWARD_APPLICANTS_COUNT,
    name: 'No. of Applicants',
    options: [],
    type: 'number'
  }),
  rewardProposalLink: (): IPropertyTemplate => ({
    id: REWARD_PROPOSAL_LINK,
    name: 'Proposal',
    options: [],
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
