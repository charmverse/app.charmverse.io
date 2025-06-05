import type { FarcasterEventMap } from '@packages/metrics/mixpanel/interfaces/FarcasterEvents';

import type { ApiEventMap } from './ApiEvent';
import type { BountyEventMap } from './BountyEvent';
import type { CredentialEventMap } from './CredentialEvent';
import type { ForumEventMap } from './ForumEvent';
import type { GithubAppEventMap } from './GithubAppEvent';
import type { PageEventMap } from './PageEvent';
import type { ProjectEventMap } from './ProjectEvent';
import type { ProposalEventMap } from './ProposalEvent';
import type { SettingEventMap } from './SettingEvent';
import type { UserEventMap } from './UserEvent';

export interface MixpanelTrackBase {
  // distinct_id - property name required by mixpanel to identify unique users
  distinct_id: string;
  isAnonymous?: boolean;
}

export interface MixpanelUserProfile {
  $created: Date;
  $name: string;
  discordConnected: boolean;
  walletConnected: boolean;
  spaces?: string[];
}

export type MixpanelEventMap = UserEventMap &
  ProposalEventMap &
  PageEventMap &
  BountyEventMap &
  SettingEventMap &
  ForumEventMap &
  ApiEventMap &
  CredentialEventMap &
  FarcasterEventMap &
  ProjectEventMap &
  GithubAppEventMap;

export type MixpanelEvent = MixpanelEventMap[keyof MixpanelEventMap];
export type MixpanelEventName = keyof MixpanelEventMap;
