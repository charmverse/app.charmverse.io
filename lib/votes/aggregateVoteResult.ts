import { UserVote } from '@prisma/client';
import { ExtendedVote } from './interfaces';

export function aggregateVoteResult (userVotes: UserVote[], userId: string) {
  const aggregatedResult: ExtendedVote['aggregatedResult'] = {};
  let userChoice: string | null = null;
  userVotes.forEach(userVote => {
    if (userId && userId === userVote.userId) {
      userChoice = userVote.choice;
    }
    aggregatedResult[userVote.choice] = 1 + (aggregatedResult[userVote.choice] ? aggregatedResult[userVote.choice] : 0);
  });

  return {
    userChoice,
    aggregatedResult
  };
}
