import type { Vote } from '@charmverse/core/prisma';

import { VOTE_STATUS } from './interfaces';

export const isVotingClosed = (vote: Pick<Vote, 'deadline' | 'status'>) => {
  return vote.status !== VOTE_STATUS[0] || vote.deadline <= new Date();
};
