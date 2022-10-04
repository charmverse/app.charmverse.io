import { Data } from 'emoji-mart';

import type { ProposalEvents } from './ProposalEvents';
import type { UserEvents } from './UserEvents';

export interface BaseEvent {
  userId: string;
}

export interface ResourceEvent extends BaseEvent {
  resourceId: string;
}

export interface SpaceEvent extends BaseEvent {
  spaceId: string;
  spaceName?: string;
}

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

export type MixpanelEvent = UserEvents & ProposalEvents

export type MixpanelEventName = keyof MixpanelEvent

