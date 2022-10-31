
import { prisma } from 'db';

(async () => {

  const votesPassedDeadline = await prisma.vote.findMany({
    where: {
      context: 'proposal',
      deadline: {
        lte: new Date()
      }
    },
    include: {
      userVotes: true,
      voteOptions: true
    }
  });
  console.log('closed proposal votes', votesPassedDeadline.length);

  const proposalsToCloseIds = votesPassedDeadline.map(vote => vote.pageId);

  const proposalsToClose = await prisma.proposal.findMany({
    where: {
      id: {
        in: proposalsToCloseIds
      }
    }
  })

  console.log('closed proposals', proposalsToClose.length);
  console.log('proposalsToClose', proposalsToClose.filter(p => p.status !== 'vote_closed').length);

  await prisma.proposal.updateMany({
    where: {
      id: {
        in: proposalsToCloseIds
      }
    },
    data: {
      status: 'vote_closed'
    }
  })


})();