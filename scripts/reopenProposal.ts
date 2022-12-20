
import { prisma } from 'db'
import { strict as assert } from 'node:assert';

async function reopenProposal (path: string, newDate: Date) {
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

  const vote = page.votes[0];
  assert(vote, 'Vote not found');
  const proposal = page.proposal;
  assert(proposal, 'Proposal not found');

  console.log('Proposal + Vote found', { voteDeadline: vote.deadline, voteStatus: vote.status, proposalStatus: proposal.status });

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

reopenProposal('story-dao/page-04742242151671694', new Date(2022, 11, 21, 21 ));
reopenProposal('story-dao/page-08009722798423935', new Date(2022, 11, 21, 23 ));