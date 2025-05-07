// @ts-nocheck
import { Page, Proposal, Space, Vote, VoteStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from '@packages/utils/errors';
import { getVote } from 'lib/votes/getVote';
import { ExtendedVote } from 'lib/votes/interfaces';

type Input = {
  proposalIds: string[];
};

type ProposalOutput = {
  proposalId: string;
  title: string;
  spaceDomain: string;
  // Should receive one or the other
  voteStatus: VoteStatus | null;
  snapshotProposalId: string | null;
};

export async function closeOutProposals({ proposalIds }: Input): Promise<ProposalOutput[]> {
  throw new Error('This script does not support the evaluation-based proposal flow');
  const proposals = await prisma.proposal.findMany({
    where: {
      id: {
        in: proposalIds
      },
      // Only close out proposals that are active
      status: 'vote_active'
    },
    include: {
      page: {
        select: {
          title: true,
          snapshotProposalId: true,
          votes: {
            where: {
              context: 'proposal'
            }
          },
          space: {
            select: {
              domain: true
            }
          }
        }
      }
    }
  });

  // Should throw an error also if number of active proposals is lower than proposal IDs
  if (proposals.length < proposalIds.length) {
    throw new DataNotFoundError(
      `Missing proposals with ID: ${proposalIds.filter((id) => !proposals.find((p) => p.id === id)).join(', ')}`
    );
  }

  const finalOutputs: ProposalOutput[] = await prisma.$transaction(async (tx) => {
    let outputs: ProposalOutput[] = [];

    for (const proposal of proposals) {
      const { page } = proposal as any as Proposal & { page: Page & { space: Space; votes: Vote[] } };
      const { votes, space, title, snapshotProposalId } = page;

      let voteStatus: VoteStatus | null = null;

      if (page.votes.length) {
        const tenSecondsAgo = new Date(Date.now() - 10000);

        await tx.vote.update({
          where: {
            id: votes[0].id
          },
          data: {
            deadline: tenSecondsAgo
          }
        });

        const voteAfterUpdate = (await getVote(votes[0].id)) as ExtendedVote;
        voteStatus = voteAfterUpdate.status;

        await tx.vote.update({
          where: {
            id: votes[0].id
          },
          data: {
            status: voteStatus
          }
        });
      }

      const updatedProposal = await tx.proposal.update({
        where: {
          id: proposal.id
        },
        data: {
          status: 'vote_closed'
        }
      });

      outputs.push({
        proposalId: updatedProposal.id,
        title,
        spaceDomain: space.domain,
        voteStatus,
        snapshotProposalId
      });
    }
    return outputs;
  });

  return finalOutputs;
}

closeOutProposals({
  // These IDs can be obtained by opening proposal in popup view from proposals list
  proposalIds: [
    '53bf33bd-3227-4bf1-80a0-977049558d4e',
    '692aaf47-7a38-4279-a0e2-7085883f4edc',
    'e63c1826-0a71-4513-b137-9529bee30290'
  ]
})
  .then(console.log)
  .catch(console.error);
