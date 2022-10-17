
import type { PageEvent } from 'lib/metrics/mixpanel/interfaces/PageEvent';

import type { ResourceEvent } from './ResourceEvent';

type BountyEvent = ResourceEvent & PageEvent;

type BountyRewardEvent = BountyEvent & {
  rewardToken: string;
  rewardAmount: string | number;
}

type BountyCreatedEvent = BountyRewardEvent & {
  pageId: string;
}

type BountyPaidEvent = BountyEvent & {
  walletType: 'Gnosis Safe' | 'Individual Wallet';
}

export interface BountyEventMap {
  bounty_created: BountyCreatedEvent;
  bounty_submission_reviewed: BountyEvent;
  bounty_submission_rejected: BountyEvent;
  bounty_application : BountyRewardEvent;
  bounty_application_accepted : BountyRewardEvent;
  bounty_application_rejected: BountyRewardEvent;
  bounty_complete: BountyRewardEvent;
  bounty_paid: BountyPaidEvent;
}

