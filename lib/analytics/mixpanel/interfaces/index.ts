import { ProposalEvents } from './ProposalEvents';
import { UserEvents } from './UserEvents';

export type MixpanelEvent = UserEvents & ProposalEvents

export type MixpanelEventName = keyof MixpanelEvent

