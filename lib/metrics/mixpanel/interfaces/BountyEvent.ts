import type { BaseEvent } from './BaseEvent';
import type { PageEvent } from './PageEvent';
import type { ResourceEvent } from './ResourceEvent';

type BountyEvent = ResourceEvent & PageEvent;

type BountyRewardEvent = BountyEvent & {
  rewardToken: string | null;
  rewardAmount: string | number | null;
  customReward: string | null;
};

type BountyCreatedEvent = BountyRewardEvent & {
  pageId: string;
};

type BountyPaidEvent = BountyEvent & {
  walletType: 'Gnosis Safe' | 'Individual Wallet';
  rewardToken?: string | null;
  rewardAmount?: string | number | null;
};

export interface BountyEventMap {
  bounty_created: BountyCreatedEvent;
  bounty_submission_reviewed: BountyEvent;
  bounty_submission_rejected: BountyEvent;
  bounty_application: BountyRewardEvent;
  bounty_application_accepted: BountyRewardEvent;
  bounty_application_rejected: BountyRewardEvent;
  bounty_complete: BountyRewardEvent;
  bounty_paid: BountyPaidEvent;
  export_bounties_csv: BaseEvent;
}
