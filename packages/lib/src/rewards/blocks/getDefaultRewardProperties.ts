import type { ApplicationStatus, BountyStatus } from '@charmverse/core/prisma-client';
import type { IPropertyTemplate } from '@packages/databases/board';
import type { Constants } from '@packages/databases/constants';
import type { FeatureTitleVariation } from '@packages/features/getFeatureTitle';

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
  REWARD_PROPOSAL_LINK,
  APPLICANT_STATUS_BLOCK_ID
} from './constants';

// define properties that will apply to all source fields
const defaultOptions = { readOnly: true, options: [] };

const rewardStatusOptions: { id: BountyStatus; value: string; color: keyof (typeof Constants)['menuColors'] }[] = [
  { id: 'open', value: 'Open', color: 'propColorTeal' },
  { id: 'complete', value: 'Approved', color: 'propColorBlue' },
  { id: 'paid', value: 'Paid', color: 'propColorGreen' }
];

const applicantStatusOptions: {
  id: ApplicationStatus;
  value: string;
  color: keyof (typeof Constants)['menuColors'];
}[] = [
  { id: 'applied', value: 'Applied', color: 'propColorDefault' },
  { id: 'review', value: 'Review', color: 'propColorYellow' },
  { id: 'complete', value: 'Approved', color: 'propColorBlue' },
  { id: 'inProgress', value: 'In Progress', color: 'propColorTeal' },
  { id: 'cancelled', value: 'Cancelled', color: 'propColorRed' },
  { id: 'processing', value: 'Processing', color: 'propColorTeal' },
  { id: 'paid', value: 'Paid', color: 'propColorGreen' },
  { id: 'submission_rejected', value: 'Submission Rejected', color: 'propColorRed' },
  { id: 'rejected', value: 'Rejected', color: 'propColorRed' }
];

const rewardDbProperties = {
  rewardStatus: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: REWARD_STATUS_BLOCK_ID,
    name: 'Status',
    options: rewardStatusOptions,
    type: 'select'
  }),
  rewardApplicantStatus: (): IPropertyTemplate => ({
    ...defaultOptions,
    id: APPLICANT_STATUS_BLOCK_ID,
    name: 'Applicant Status',
    options: applicantStatusOptions,
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
  rewardProposalLink: ({ name }: { name: string }): IPropertyTemplate => ({
    ...defaultOptions,
    id: REWARD_PROPOSAL_LINK,
    name,
    type: 'proposalUrl'
  })
};

export function getDefaultRewardProperties({
  getFeatureTitle = (b) => b
}: {
  getFeatureTitle?: (featureName: FeatureTitleVariation) => string;
} = {}): IPropertyTemplate[] {
  const properties = [
    rewardDbProperties.rewardCreatedAt(),
    rewardDbProperties.rewardDueDate(),
    rewardDbProperties.rewardApplicants(),
    rewardDbProperties.rewardReviewers(),
    rewardDbProperties.rewardAvailableCount(),
    rewardDbProperties.rewardStatus(),
    rewardDbProperties.rewardApplicantStatus(),
    rewardDbProperties.rewardAmount(),
    rewardDbProperties.rewardChain(),
    rewardDbProperties.rewardCustomValue(),
    rewardDbProperties.rewardApplicantsNumber(),
    rewardDbProperties.rewardProposalLink({ name: getFeatureTitle('Proposal') })
  ];

  return properties;
}
