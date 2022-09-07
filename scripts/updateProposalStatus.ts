import { prisma } from '../db';

(async () => {
  const votes = await prisma.vote.findMany({
    where: {
      context: 'proposal'
    },
    select: {
      status: true,
      pageId: true
    }
  });

  const voteClosedProposalIds = votes.filter(vote => vote.status === 'Passed' || vote.status === 'Rejected' || vote.status === 'Cancelled').map(vote => vote.pageId);
  const voteActiveProposalIds = votes.filter(vote => vote.status === 'InProgress').map(vote => vote.pageId);

  await prisma.proposal.updateMany({
    where: {
      id: {
        in: voteClosedProposalIds
      }
    },
    data: {
      status: 'vote_closed'
    }
  });

  await prisma.proposal.updateMany({
    where: {
      id: {
        in: voteActiveProposalIds
      }
    },
    data: {
      status: 'vote_active'
    }
  });
})();
