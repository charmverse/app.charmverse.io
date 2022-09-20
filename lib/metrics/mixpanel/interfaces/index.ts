import type { ProposalEvents } from './ProposalEvents';
import type { UserEvents } from './UserEvents';

export interface BaseEvent {
  userId: string;
}

export interface ResourceEvent {
  resourceId: string;
}

export interface WorkspaceEvent {
  workspaceId: string;
}

export type MixpanelEvent = UserEvents & ProposalEvents

export type MixpanelEventName = keyof MixpanelEvent

