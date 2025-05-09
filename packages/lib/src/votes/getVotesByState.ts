import type { Vote, UserVote, VoteOptions } from '@charmverse/core/prisma';
import { VoteType } from '@charmverse/core/prisma';

const YES_OPTION = 'Yes';

export type VoteWithUserVotes = Vote & { userVotes: UserVote[]; voteOptions: VoteOptions[] };

export const getVotesByState = (votes: VoteWithUserVotes[]) => {
  const passedVotes: Vote[] = [];
  const rejectedVotes: Vote[] = [];

  for (const vote of votes) {
    if (vote.userVotes.length === 0) {
      rejectedVotes.push(vote);
    } else if (vote.type === VoteType.Approval) {
      const yesVoteCount = vote.userVotes.filter((uv) => {
        if (uv.choices) {
          return uv.choices.includes(YES_OPTION);
        }

        return false;
      }).length;
      const isPassed = (yesVoteCount * 100) / vote.userVotes.length >= vote.threshold;

      if (isPassed) {
        passedVotes.push(vote);
      } else {
        rejectedVotes.push(vote);
      }
    } else if (vote.type === VoteType.SingleChoice) {
      const choices: string[] = vote.userVotes.reduce((currentChoices, userVote) => {
        if (userVote.choices) {
          currentChoices.push(...userVote.choices);
        }

        return currentChoices;
      }, [] as string[]);

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
        } else if (currentIndex - index === maxCount) {
          maxChoices.push(choices[index]);
        }

        index = currentIndex;
      }

      const maxChoicePercentage = (maxCount * 100) / choices.length;

      if (maxChoicePercentage < vote.threshold) {
        rejectedVotes.push(vote);
      } else {
        passedVotes.push(vote);
      }
    } else if (vote.type === VoteType.MultiChoice) {
      passedVotes.push(vote);
    }
  }

  return {
    passedVotes,
    rejectedVotes
  };
};
