import type { ProposalStatus } from '@prisma/client';

import type { ResourceEvent } from './ResourceEvent';

interface ProposalEvent extends ResourceEvent {}

interface ProposalStatusUpdatedEvent extends ProposalEvent {
  status: ProposalStatus;
}

interface ProposalVoteCreatedEvent extends ProposalEvent {
  platform: 'charmverse' | 'snapshot';
}

export interface ProposalEventMap {
  new_proposal_created: ProposalEvent;
  new_proposal_stage: ProposalStatusUpdatedEvent;
  new_vote_created : ProposalVoteCreatedEvent;
}

