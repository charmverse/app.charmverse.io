import type { UserVote, VoteOptions } from '@prisma/client';

import type { ExtendedVote } from './interfaces';

export function aggregateVoteResult ({ userId, userVotes, voteOptions }: { voteOptions: Pick<VoteOptions, 'name'>[], userVotes: Pick<UserVote, 'choice' | 'userId'>[], userId: string }) {
  const aggregatedResult: ExtendedVote['aggregatedResult'] = {};
  voteOptions.forEach(voteOption => {
    aggregatedResult[voteOption.name] = 0;
  });
  let userChoice: string | null = null;
  userVotes.forEach(userVote => {
    if (userId && userId === userVote.userId) {
      userChoice = userVote.choice;
    }
    aggregatedResult[userVote.choice] += 1;
  });

  return {
    userChoice,
    aggregatedResult
  };
}
