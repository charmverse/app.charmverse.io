import type { Bounty, Page } from '@charmverse/core/prisma';

import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { isTruthy } from 'lib/utils/types';

import type { RewardType } from './interfaces';

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
};

export function getRewardErrors({
  page,
  linkedPageId,
  reward,
  rewardType,
  isProposalTemplate
}: ValidationInput): string[] {
  const errors: string[] = [];
  if (typeof reward.rewardAmount === 'number' && reward.rewardAmount < 0) {
    errors.push('Reward amount must be a positive number');
  } else if (reward.rewardAmount && (!reward.chainId || !reward.rewardToken)) {
    errors.push(`Reward amount must also have chainId and token`);
  } else if (rewardType === 'custom' && !reward.customReward) {
    errors.push('Custom reward is required');
  } else if (rewardType === 'token' && !(reward.chainId && reward.rewardToken && reward.rewardAmount)) {
    errors.push('Token information is required');
  }
  const isTemplate = page?.type === 'bounty_template';
  if (!page?.title && !linkedPageId) {
    errors.push('Page title is required');
  }
  if (!isTemplate) {
    // these values are not required for templates
    if (!reward.reviewers?.length) {
      errors.push('Reviewer is required');
    } else if (reward.assignedSubmitters && reward.assignedSubmitters.length === 0 && !isProposalTemplate) {
      errors.push('You need to assign at least one submitter');
    }
  }
  return errors;
}
