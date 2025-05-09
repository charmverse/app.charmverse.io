import { prisma } from '@charmverse/core/prisma-client';
import { getVotesByState } from '@packages/lib/votes/getVotesByState';
import { VOTE_STATUS } from '@packages/lib/votes/interfaces';
import { publishProposalEvent } from '@packages/lib/webhookPublisher/publishEvent';

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

  const { passedVotes, rejectedVotes } = getVotesByState(votesPassedDeadline);

  const evaluationsToUpdate = await prisma.proposalEvaluation.findMany({
    where: {
      voteId: {
        in: votesPassedDeadline.map((v) => v.id)
      }
    }
  });

  const passedEvaluations = evaluationsToUpdate.filter((e) => passedVotes.some((vote) => vote.id === e.voteId));
  const failedEvaluations = evaluationsToUpdate.filter((e) => rejectedVotes.some((vote) => vote.id === e.voteId));

  await prisma.$transaction([
    // update passed votes
    prisma.vote.updateMany({
      where: {
        id: {
          in: passedVotes.map((v) => v.id)
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
          in: rejectedVotes.map((v) => v.id)
        }
      },
      data: {
        status: 'Rejected'
      }
    }),
    prisma.proposalEvaluation.updateMany({
      where: {
        id: {
          in: passedEvaluations.map((e) => e.id)
        }
      },
      data: {
        result: 'pass',
        completedAt: new Date()
      }
    }),
    prisma.proposalEvaluation.updateMany({
      where: {
        id: {
          in: failedEvaluations.map((e) => e.id)
        }
      },
      data: {
        result: 'fail',
        completedAt: new Date()
      }
    })
  ]);

  await Promise.all([
    [...rejectedVotes, ...passedVotes].map((vote) => {
      const evaluation = passedEvaluations.find((e) => e.voteId === vote.id);
      if (vote.pageId && evaluation) {
        return publishProposalEvent({
          spaceId: vote.spaceId,
          proposalId: vote.pageId,
          currentEvaluationId: evaluation.id,
          userId: evaluation.decidedBy ?? vote.createdBy
        });
      }
      return Promise.resolve();
    })
  ]);

  return votesPassedDeadline.length;
};

export default updateVoteStatus;
