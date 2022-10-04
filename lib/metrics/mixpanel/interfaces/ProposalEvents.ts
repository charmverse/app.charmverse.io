import type { ProposalStatus } from '@prisma/client';

import type { SpaceEvent } from 'lib/metrics/mixpanel/interfaces';

import type { ResourceEvent } from './index';

interface ProposalEvent extends SpaceEvent, ResourceEvent {}

interface ProposalStatusUpdatedEvent extends ProposalEvent {
  status: ProposalStatus;
}

interface ProposalVoteCastedEvent extends ProposalEvent {
  platform: 'charmverse' | 'snapshot';
}

export interface ProposalEvents {
  new_proposal_created: ProposalEvent;
  new_proposal_stage: ProposalStatusUpdatedEvent;
  new_vote_created : ProposalVoteCastedEvent;
}

