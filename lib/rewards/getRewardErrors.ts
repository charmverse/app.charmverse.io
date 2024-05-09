import type { Bounty, Page } from '@charmverse/core/prisma';

import type { RewardFields } from './blocks/interfaces';
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
  isMilestone?: boolean;
  isProposalTemplate?: boolean;
};

function getRewardPrizeError(
  {
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
  },
  isTemplate: boolean,
  isProposalTemplate?: boolean
) {
  const errors: string[] = [];

  if (typeof rewardAmount === 'number' && rewardAmount < 0) {
    errors.push('Reward amount must be a positive number');
  } else if (rewardAmount && (!chainId || !rewardToken)) {
    errors.push(`Reward amount must also have chainId and token`);
  } else if (rewardType === 'custom' && !customReward) {
    errors.push('Custom reward is required');
  } else if (
    rewardType === 'token' &&
    !(chainId && rewardToken && (rewardAmount || isTemplate || isProposalTemplate))
  ) {
    errors.push('Token information is required');
  }

  return errors;
}

export function getRewardErrors({
  page,
  linkedPageId,
  reward,
  rewardType,
  isMilestone,
  isProposalTemplate
}: ValidationInput): string[] {
  const isTemplate = page?.type === 'bounty_template';
  const errors: string[] = [];
  if (!page?.title && !linkedPageId) {
    errors.push('Page title is required');
  }

  if (!isMilestone) {
    // these values are not required for templates
    if (!reward.reviewers?.length) {
      errors.push('Reviewer is required');
    } else if (!isTemplate && reward.assignedSubmitters && reward.assignedSubmitters.length === 0) {
      errors.push('You need to assign at least one submitter');
    }
  } else if (!isProposalTemplate) {
    if (reward.assignedSubmitters && reward.assignedSubmitters.length === 0) {
      errors.push('You need to assign at least one submitter');
    }
  }

  errors.push(
    ...getRewardPrizeError(
      {
        ...reward,
        rewardType
      },
      isTemplate,
      isProposalTemplate
    )
  );
  return errors;
}

export function getEvaluationFormError(
  evaluation: RewardEvaluation,
  reward: RewardWithUsers,
  isTemplate: boolean
): string | false {
  switch (evaluation.type) {
    case 'apply':
      return false;
    case 'submit': {
      const workflowId = (reward.fields as RewardFields).workflowId;
      if (workflowId === 'assigned' || workflowId === 'assigned_kyc') {
        return (reward.assignedSubmitters ?? []).length !== 0 ? false : 'Applicants are required for the step';
      }
      return false;
    }
    case 'application_review':
    case 'review':
      return reward.reviewers.length === 0 ? `Reviewers are required for the "${evaluation.title}" step` : false;
    case 'payment':
      return getRewardPrizeError(reward, isTemplate).join(', ');
    default:
      return false;
  }
}
