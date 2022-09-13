import { ProposalTask } from './interface';

export const ProposalActionRecord: Record<ProposalTask['action'], string> = {
  discuss: 'Discuss',
  move_to_discussion: 'Move to discussion',
  review: 'Review',
  start_vote: 'Start vote',
  vote: 'Vote'
};
