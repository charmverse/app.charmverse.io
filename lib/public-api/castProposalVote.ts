import { prisma } from 'db';
import type { CastProposalVoteRequestBody } from 'lib/public-api/interfaces';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError, UndesirableOperationError } from 'lib/utilities/errors';
import { castVote as castVoteService } from 'lib/votes';

export async function castProposalVote({ userId, proposalId, choice }: CastProposalVoteRequestBody) {
  const vote = await prisma.vote.findFirst({
    where: {
      pageId: proposalId,
      page: {
        deletedAt: null
      }
    },
    include: {
      voteOptions: true,
      page: {
        select: {
          proposal: true
        }
      }
    }
  });

  if (!vote || !vote.page?.proposal) {
    throw new DataNotFoundError(`A vote for proposal id ${proposalId} was not found.`);
  }

  if (vote.page.proposal.status !== 'vote_active') {
    throw new UndesirableOperationError(`Voting for proposal with id: ${proposalId} is not active.`);
  }

  const { error } = await hasAccessToSpace({
    userId,
    spaceId: vote.spaceId
  });

  if (error) {
    throw error;
  }

  return castVoteService(choice, vote, userId);
}
