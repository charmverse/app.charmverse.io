import type { BaseEvent, WorkspaceEvent } from 'lib/metrics/mixpanel/interfaces';
import type { ResourceEvent } from './index';

interface ProposaEvent extends BaseEvent, WorkspaceEvent, ResourceEvent {}

interface ProposalStageEvent extends ProposaEvent {
  stageName: string
}

export interface ProposalEvents {
  ProposalCreated: ProposaEvent
  ProposalStageCreated: ProposalStageEvent
}

