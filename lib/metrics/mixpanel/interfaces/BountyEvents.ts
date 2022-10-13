
import type { ResourceEvent } from './ResourceEvent';

type BountyRewardEvent = ResourceEvent & {
  rewardToken: string;
  rewardAmount: string | number;
}

type BountyCreatedEvent = BountyRewardEvent & {
  pageId: string;
}

type BountySubmissionEvent = ResourceEvent & {
  pageId?: string;
}

type BountyPaidEvent = ResourceEvent & {
  walletType: 'Gnosis Safe' | 'Individual Wallet';
}

export interface BountyEventMap {
  bounty_created: BountyCreatedEvent;
  bounty_submission_reviewed: BountySubmissionEvent;
  bounty_submission_rejected: BountySubmissionEvent;
  bounty_application : BountyRewardEvent;
  bounty_application_accepted : BountyRewardEvent;
  bounty_application_rejected: BountyRewardEvent;
  bounty_complete: BountyRewardEvent;
  bounty_paid: BountyPaidEvent;
}

