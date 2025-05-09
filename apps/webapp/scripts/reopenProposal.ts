// @ts-nocheck
import { prisma } from '@charmverse/core/prisma-client';
import { strict as assert } from 'node:assert';

/**
 * See this doc for usage instructions
 * https://app.charmverse.io/charmverse/page-8245745086136205
 */
async function reopenProposal(path: string, newDate: Date) {
  throw new Error('This script does not support evaluation-based proposal flow');
  const spaceDomain = path.split('/')[0];
  const spacePagePath = path.split('/')[1];

  const page = await prisma.page.findFirstOrThrow({
    where: {
      path: spacePagePath,
      space: {
        domain: spaceDomain
      }
    },
    include: {
      proposal: true,
      votes: true
    }
  });

  const proposal = page.proposal;
  assert(proposal, 'Proposal not found');
  const vote = page.votes.find((vote) => vote.context === 'proposal');
  assert(vote, 'Proposal vote not found');

  console.log('Proposal + Vote found', {
    voteDeadline: vote.deadline,
    voteStatus: vote.status,
    proposalStatus: proposal.status
  });

  const [voteRes, proposalRes] = await prisma.$transaction([
    prisma.vote.update({
      where: {
        id: vote.id
      },
      data: {
        deadline: newDate,
        status: 'InProgress'
      }
    }),
    prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
        status: 'vote_active'
      }
    })
  ]);
  console.log('Vote updated', voteRes.id, voteRes.deadline, voteRes.status);
  console.log('Proposal updated', proposalRes.id, proposalRes.status);
}

reopenProposal('spacedomain/page-5167169422333', new Date(2022, 11, 21, 23));
