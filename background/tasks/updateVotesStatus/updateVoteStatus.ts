
import { prisma } from 'db';
import { getVotesByState } from 'lib/votes/getVotesByState';
import { VOTE_STATUS } from 'lib/votes/interfaces';

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

  const { passedVotes, rejectedVotes } = await getVotesByState(votesPassedDeadline);

  const proposalPageIds = votesPassedDeadline
    .filter(v => v.context === 'proposal')
    .map(v => v.pageId);

  await prisma.$transaction([
    // update passed votes
    prisma.vote.updateMany({
      where: {
        id: {
          in: passedVotes.map(v => v.id)
        }
      },
      data: {
        status: 'Passed'
      }
    }),
    // update rejected votes
    prisma.vote.updateMany({
      where: {
        id: {
          in: rejectedVotes.map(v => v.id)
        }
      },
      data: {
        status: 'Rejected'
      }
    }),
    // update proposals
    prisma.proposal.updateMany({
      where: {
        id: {
          in: proposalPageIds
        }
      },
      data: {
        status: 'vote_closed'
      }
    })
  ]);

  return votesPassedDeadline.length;
};

export default updateVoteStatus;
