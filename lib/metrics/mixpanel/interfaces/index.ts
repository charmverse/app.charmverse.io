import type { BountyEventMap } from './BountyEvent';
import type { PageEventMap } from './PageEvent';
import type { ProposalEventMap } from './ProposalEvent';
import type { SettingEventMap } from './SettingEvent';
import type { UserEventMap } from './UserEvent';

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

export type MixpanelEventName = keyof MixpanelEventMap;
