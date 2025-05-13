import type { ProposalStatus } from '@charmverse/core/prisma';

import type { PageEvent } from './PageEvent';
import type { ResourceEvent } from './ResourceEvent';

type ProposalEvent = ResourceEvent & PageEvent;

interface ProposalStatusUpdatedEvent extends ProposalEvent {
  status: ProposalStatus;
}

interface ProposalVoteEvent extends ProposalEvent {
  platform: 'charmverse' | 'snapshot';
}

export interface ProposalEventMap {
  new_proposal_created: ProposalEvent;
  new_proposal_stage: ProposalStatusUpdatedEvent;
  new_vote_created: ProposalVoteEvent;
  user_cast_a_vote: ProposalVoteEvent;
  create_proposal_comment: ProposalEvent;
  upvote_proposal_comment: ProposalEvent;
  downvote_proposal_comment: ProposalEvent;
}
