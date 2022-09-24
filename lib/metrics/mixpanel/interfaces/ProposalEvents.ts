import type { ProposalStatus } from '@prisma/client';
import type { SpaceEvent } from 'lib/metrics/mixpanel/interfaces';
import type { ResourceEvent } from './index';

interface ProposalEvent extends SpaceEvent, ResourceEvent {}

interface ProposalStatusUpdatedEvent extends ProposalEvent {
  status: ProposalStatus;
}

interface ProposalVoteCastedEvent extends ProposalEvent {
  platform: 'charmverse' | 'snapshot'
}

export interface ProposalEvents {
  ProposalCreated: ProposalEvent;
  ProposalStatusUpdated: ProposalStatusUpdatedEvent;
  ProposalVoteCasted: ProposalVoteCastedEvent;
}

