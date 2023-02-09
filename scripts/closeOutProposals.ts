import { Page, Proposal, Space, Vote, VoteStatus } from "@prisma/client";
import { prisma } from "db";
import { DataNotFoundError, InvalidInputError } from "lib/utilities/errors";
import { getVote } from "lib/votes";
import { ExtendedVote } from "lib/votes/interfaces";




type Input = {
  proposalIds: string[]
}

type ProposalOutput = {
  proposalId: string;
  title: string;
  spaceDomain: string;
  // Should receive one or the other
  voteStatus: VoteStatus | null;
  snapshotProposalId: string | null;
}

export async function closeOutProposals({proposalIds}: Input): Promise<ProposalOutput[]> {

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
    throw new DataNotFoundError(`Missing proposals with ID: ${proposalIds.filter(id => !proposals.find(p => p.id === id)).join(', ')}`);
  }

  const finalOutputs: ProposalOutput[] = await prisma.$transaction(async(tx) => {
    let outputs: ProposalOutput[] = [];

    for (const proposal of proposals) {
      const { page } = proposal as any as (Proposal & {page: Page & {space: Space, votes: Vote[]}});
      const { votes, space, title, snapshotProposalId } = page;

      let voteStatus: VoteStatus | null = null;

      if (!page.snapshotProposalId && !page.votes?.length) {
        throw new InvalidInputError(`Proposal ID ${proposal.id} with title ${title} and proposal status ${proposal.status} has no snapshot proposal ID or votes`)
      } else if (page.votes.length) {
        const tenSecondsAgo = new Date(Date.now() - 10000);

        await tx.vote.update({
          where: {
            id: votes[0].id
          },
          data: {
            deadline: tenSecondsAgo
          }
        });

        const voteAfterUpdate = await getVote(votes[0].id) as ExtendedVote;
        voteStatus = voteAfterUpdate.status

        await tx.vote.update({
          where: {
            id: votes[0].id
          },
          data: {
            status: voteStatus
          }
        })
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
  })

  return finalOutputs;

}

closeOutProposals({
  // These IDs can be obtained by opening proposal in popup view from proposals list
  proposalIds: ['d0f959ca-f2c0-4021-86eb-92226ba24424', 'cfdf1581-110b-44a6-9b37-f4ea8e4372d9']
}).then(console.log).catch(console.error)