import { prisma } from 'db';
import { UserVote } from '@prisma/client';
import { ExtendedVote, VOTE_STATUS } from 'lib/votes/interfaces';

const getVotesByState = async (votes: ExtendedVote[]) => {

  const passedVotes: string[] = [];
  const rejectedVotes: string[] = [];

  for (const vote of votes) {
    if (vote.userVotes.length === 0) {
      rejectedVotes.push(vote.id);
      continue;
    }
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

    const maxChoicePercentage = maxCount * 100 / choices.length;

    if (maxChoicePercentage < vote.threshold) {
      rejectedVotes.push(vote.id);
    }
    else {
      passedVotes.push(vote.id);
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

  const { passedVotes, rejectedVotes } = await getVotesByState(votesPassedDeadline as ExtendedVote[]);

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
