import type { UserVote, VoteOptions } from '@charmverse/core/prisma';

import type { ExtendedVote } from './interfaces';

export function aggregateVoteResult({
  userId,
  userVotes,
  voteOptions
}: {
  voteOptions: Pick<VoteOptions, 'name'>[];
  userVotes: Pick<UserVote, 'choice' | 'choices' | 'userId'>[];
  userId?: string;
}) {
  const aggregatedResult: ExtendedVote['aggregatedResult'] = {};
  voteOptions.forEach((voteOption) => {
    aggregatedResult[voteOption.name] = 0;
  });

  let userChoice: string[] | null = [];

  userVotes.forEach((userVote) => {
    const currentUserChoice = userVote.choice ? [userVote.choice] : userVote.choices;
    if (userId && userId === userVote.userId) {
      userChoice = currentUserChoice;
    }

    currentUserChoice.forEach((choice) => {
      aggregatedResult[choice] += 1;
    });
  });

  return {
    userChoice: userChoice.length ? userChoice : null,
    aggregatedResult
  };
}
