
import type { PageEventMap } from 'lib/metrics/mixpanel/interfaces/PageEvents';

import type { ProposalEventMap } from './ProposalEvents';
import type { UserEventMap } from './UserEvents';

export interface MixpanelTrackBase {
  // distinct_id - property name required by mixpanel to identify unique users
  distinct_id: string;
}

export interface MixpanelUserProfile {
  $created: Date;
  $name: string;
  discordConnected: boolean;
  walletConnected: boolean;
  spaces?: string[];
}

export type MixpanelEventMap = UserEventMap & ProposalEventMap & PageEventMap

export type MixpanelEventName = keyof MixpanelEventMap

