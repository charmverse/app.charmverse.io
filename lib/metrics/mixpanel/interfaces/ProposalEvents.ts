import type { ProposalStatus } from '@prisma/client';

import type { ResourceEvent } from './ResourceEvent';
import type { SpaceEvent } from './SpaceEvent';

interface ProposalEvent extends SpaceEvent, ResourceEvent {}

interface ProposalStatusUpdatedEvent extends ProposalEvent {
  status: ProposalStatus;
}

interface ProposalVoteCastedEvent extends ProposalEvent {
  platform: 'charmverse' | 'snapshot';
}

export interface ProposalEventMap {
  new_proposal_created: ProposalEvent;
  new_proposal_stage: ProposalStatusUpdatedEvent;
  new_vote_created : ProposalVoteCastedEvent;
}

