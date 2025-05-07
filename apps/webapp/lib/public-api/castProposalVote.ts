import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import { DataNotFoundError, UndesirableOperationError } from '@packages/utils/errors';
import { castVote as castVoteService } from '@packages/lib/votes/castVote';

export async function castProposalVote({
  userId,
  proposalId,
  choice
}: {
  userId: string;
  proposalId: string;
  choice: string;
}) {
  const vote = await prisma.vote.findFirst({
    where: {
      page: {
        deletedAt: null,
        proposal: {
          id: proposalId
        }
      }
    },
    include: {
      voteOptions: true,
      page: {
        select: {
          proposal: {
            include: {
              evaluations: true
            }
          }
        }
      }
    }
  });

  if (!vote || !vote.page?.proposal) {
    throw new DataNotFoundError(`A vote for proposal id ${proposalId} was not found.`);
  }

  const currentEvaluation = getCurrentEvaluation(vote.page.proposal.evaluations);
  const isActiveVote = currentEvaluation?.result === null && currentEvaluation?.type === 'vote';
  if (!isActiveVote) {
    throw new UndesirableOperationError(`Voting for proposal with id: ${proposalId} is not active.`);
  }

  const { error } = await hasAccessToSpace({
    userId,
    spaceId: vote.spaceId
  });

  if (error) {
    throw error;
  }

  return castVoteService([choice], vote, userId);
}
