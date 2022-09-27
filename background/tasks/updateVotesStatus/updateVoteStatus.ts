import type { UserVote, Vote, VoteOptions } from '@prisma/client';
import { prisma } from 'db';
import { getVotesByState } from 'lib/votes/getVotesByState';
import { VOTE_STATUS } from 'lib/votes/interfaces';

type VoteWithUserVotes = (Vote & { userVotes: UserVote[], voteOptions: VoteOptions[] })

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

  const closedProposals = await prisma.vote.findMany({
    where: {
      pageId: {
        in: [...rejectedVotes, ...passedVotes]
      },
      context: 'proposal'
    },
    select: {
      pageId: true
    }
  });

  const closedProposalIds = closedProposals.map(closedProposal => closedProposal.pageId);

  await prisma.proposal.updateMany({
    where: {
      id: {
        in: closedProposalIds
      }
    },
    data: {
      status: 'vote_closed'
    }
  });

  return passedVotes.length + rejectedVotes.length;
};

export default updateVoteStatus;
