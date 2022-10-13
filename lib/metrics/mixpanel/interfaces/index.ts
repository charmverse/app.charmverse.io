
import type { BountyEventMap } from 'lib/metrics/mixpanel/interfaces/BountyEvents';
import type { PageEventMap } from 'lib/metrics/mixpanel/interfaces/PageEvents';
import type { SettingEventMap } from 'lib/metrics/mixpanel/interfaces/SettingEvents';

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

export type MixpanelEventMap = UserEventMap & ProposalEventMap & PageEventMap & BountyEventMap & SettingEventMap;

export type MixpanelEventName = keyof MixpanelEventMap

