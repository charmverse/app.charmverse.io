import type { Bounty, Page } from '@charmverse/core/prisma';

import { getRewardType } from './getRewardType';
import type { RewardEvaluation } from './getRewardWorkflows';
import type { RewardType, RewardWithUsers } from './interfaces';

type ValidationInput = {
  page: Partial<Pick<Page, 'title' | 'type'>> | null;
  reward: Partial<
    Pick<Bounty, 'rewardAmount' | 'chainId' | 'rewardToken' | 'customReward'> & {
      assignedSubmitters: string[] | null;
      reviewers: any[];
    }
  >;
  linkedPageId?: string | null; // the page a bounty is attached to
  rewardType: RewardType;
  isProposalTemplate?: boolean;
  isMilestone?: boolean;
  templateId?: string;
};

function getRewardPrizeError({
  chainId,
  customReward,
  rewardAmount,
  rewardToken,
  rewardType
}: {
  rewardType: RewardType;
  chainId?: number | null;
  rewardToken?: string | null;
  rewardAmount?: number | null;
  customReward?: string | null;
}) {
  const errors: string[] = [];

  if (typeof rewardAmount === 'number' && rewardAmount < 0) {
    errors.push('Reward amount must be a positive number');
  } else if (rewardAmount && (!chainId || !rewardToken)) {
    errors.push(`Reward amount must also have chainId and token`);
  } else if (rewardType === 'custom' && !customReward) {
    errors.push('Custom reward is required');
  } else if (rewardType === 'token' && !(chainId && rewardToken && rewardAmount)) {
    errors.push('Token information is required');
  }

  return errors;
}

export function getRewardErrors({
  page,
  linkedPageId,
  reward,
  rewardType,
  isProposalTemplate,
  isMilestone,
  templateId
}: ValidationInput): string[] {
  const errors: string[] = getRewardPrizeError({
    ...reward,
    rewardType
  });

  const isTemplate = page?.type === 'bounty_template';
  if (!page?.title && !linkedPageId) {
    errors.push('Page title is required');
  }
  if (!isTemplate && !isProposalTemplate) {
    // these values are not required for templates
    if (!reward.reviewers?.length) {
      errors.push('Reviewer is required');
    } else if (reward.assignedSubmitters && reward.assignedSubmitters.length === 0) {
      errors.push('You need to assign at least one submitter');
    }
  }
  if (isMilestone && !templateId) {
    errors.push('Template is required for milestone');
  }
  return errors;
}

export function getEvaluationFormError(evaluation: RewardEvaluation, reward: RewardWithUsers): string | false {
  switch (evaluation.type) {
    case 'apply':
    case 'submit':
      return false;
    case 'application_review':
    case 'review':
      return reward.reviewers.length === 0 ? `Reviewers are required for the "${evaluation.title}" step` : false;
    case 'payment':
      return getRewardPrizeError({
        ...reward,
        rewardType: getRewardType(reward)
      }).join(', ');
    default:
      return false;
  }
}
