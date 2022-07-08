import { UserVote, Vote, VoteOptions, VoteType } from '@prisma/client';
import { prisma } from 'db';
import { VOTE_STATUS } from 'lib/votes/interfaces';

const YES_OPTION = 'Yes';

type VoteWithUserVotes = (Vote & {userVotes: UserVote[], voteOptions: VoteOptions[]})

const getVotesByState = async (votes: VoteWithUserVotes[]) => {

  const passedVotes: string[] = [];
  const rejectedVotes: string[] = [];

  for (const vote of votes) {
    if (vote.userVotes.length === 0) {
      rejectedVotes.push(vote.id);
    }
    else if (vote.type === VoteType.Approval) {
      const yesVoteCount = vote.userVotes.filter((uv: UserVote) => uv.choice === YES_OPTION).length;
      const isPassed = ((yesVoteCount * 100) / vote.userVotes.length) >= vote.threshold;

      if (isPassed) {
        passedVotes.push(vote.id);
      }
      else {
        rejectedVotes.push(vote.id);
      }
    }
    else {
      const choices: string[] = vote.userVotes.map((uv: UserVote) => uv.choice).sort();

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
        rejectedVotes.push(vote.id);
      }
      else {
        passedVotes.push(vote.id);
      }
    }
  }

  return {
    passedVotes,
    rejectedVotes
  };
};

const updateVoteStatus = async () => {

  const votesPassedDeadline = await prisma.vote.findMany({
    where: {
      status: VOTE_STATUS[0],
      deadline: {
        lte: new Date()
      }
    },
    include: {
      userVotes: true,
      voteOptions: true
    }
  });

  const { passedVotes, rejectedVotes } = await getVotesByState(votesPassedDeadline as VoteWithUserVotes[]);

  await prisma.vote.updateMany({
    where: {
      id: {
        in: passedVotes
      }
    },
    data: {
      status: 'Passed'
    }
  });

  await prisma.vote.updateMany({
    where: {
      id: {
        in: rejectedVotes
      }
    },
    data: {
      status: 'Rejected'
    }
  });

  return passedVotes.length + rejectedVotes.length;
};

export default updateVoteStatus;
