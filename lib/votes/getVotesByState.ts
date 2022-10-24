import type { Vote, UserVote, VoteOptions } from '@prisma/client';
import { VoteType } from '@prisma/client';

const YES_OPTION = 'Yes';

export type VoteWithUserVotes = (Vote & { userVotes: UserVote[], voteOptions: VoteOptions[] })

export const getVotesByState = (votes: VoteWithUserVotes[]) => {

  const passedVotes: Vote[] = [];
  const rejectedVotes: Vote[] = [];

  for (const vote of votes) {
    if (vote.userVotes.length === 0) {
      rejectedVotes.push(vote);
    }
    else if (vote.type === VoteType.Approval) {
      const yesVoteCount = vote.userVotes.filter((uv) => uv.choice === YES_OPTION).length;
      const isPassed = ((yesVoteCount * 100) / vote.userVotes.length) >= vote.threshold;

      if (isPassed) {
        passedVotes.push(vote);
      }
      else {
        rejectedVotes.push(vote);
      }
    }
    else {
      const choices: string[] = vote.userVotes.map((uv) => uv.choice).sort();

      let index = 0;
      let maxCount = 0;
      let maxChoices = [];
      let currentIndex = 0;

      while (index < choices.length) {
        currentIndex = index;
        while (choices[currentIndex] === choices[index]) {
          currentIndex += 1;
        }

        if (currentIndex - index > maxCount) {
          maxCount = currentIndex - index;
          maxChoices = [choices[index]];
        }
        else if (currentIndex - index === maxCount) {
          maxChoices.push(choices[index]);
        }

        index = currentIndex;
      }

      const maxChoicePercentage = (maxCount * 100) / choices.length;

      if (maxChoicePercentage < vote.threshold) {
        rejectedVotes.push(vote);
      }
      else {
        passedVotes.push(vote);
      }
    }
  }

  return {
    passedVotes,
    rejectedVotes
  };
};
