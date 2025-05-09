import { prisma } from '@charmverse/core/prisma-client';
import { VoteSettings } from '@packages/lib/proposals/interfaces';

export async function updateVoteStrategy() {
  const voteProposalEvaluations = await prisma.proposalEvaluation.findMany({
    where: {
      type: 'vote'
    },
    select: {
      id: true,
      vote: {
        select: {
          id: true
        }
      },
      voteSettings: true
    }
  });

  let current = 0;

  for (const voteProposalEvaluation of voteProposalEvaluations) {
    try {
      const vote = voteProposalEvaluation.vote;
      const voteSettings = voteProposalEvaluation.voteSettings as VoteSettings;
      if (voteSettings) {
        const publishToSnapshot = (voteSettings as any).publishToSnapshot as boolean;
        // delete (voteSettings as any).publishToSnapshot;
        await prisma.$transaction([
          ...(vote
            ? [
                prisma.vote.update({
                  where: {
                    id: vote.id
                  },
                  data: {
                    strategy: publishToSnapshot ? 'snapshot' : 'regular'
                  }
                })
              ]
            : []),
          prisma.proposalEvaluation.update({
            where: {
              id: voteProposalEvaluation.id
            },
            data: {
              voteSettings: {
                ...voteSettings,
                strategy: publishToSnapshot ? 'snapshot' : 'regular'
              }
            }
          })
        ]);
      }
      current++;
      console.log(`Updated vote strategy: ${current}/${voteProposalEvaluations.length}`);
    } catch (error) {
      current++;
      console.error(
        `Error updating vote strategy for proposal evaluation ${voteProposalEvaluation.id} ${current}: ${error}`
      );
    }
  }
}
updateVoteStrategy().catch(console.error);
