import { Prisma, prisma } from '@charmverse/core/prisma-client';

export async function updateVoteStrategy() {
  const voteProposalEvaluations = await prisma.proposalEvaluation.findMany({
    where: {
      type: "vote"
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
  })

  let current = 0;

  for (const voteProposalEvaluation of voteProposalEvaluations) {
    try {
      const vote = voteProposalEvaluation.vote;
      if (vote && (voteProposalEvaluation.voteSettings as any).publishToSnapshot) {
        delete (voteProposalEvaluation.voteSettings as any).publishToSnapshot;
        await prisma.$transaction([
          prisma.vote.update({
            where: {
              id: vote.id
            },
            data: {
              strategy: 'snapshot'
            }
          }),
          prisma.proposalEvaluation.update({
            where: {
              id: voteProposalEvaluation.id
            },
            data: {
              voteSettings: voteProposalEvaluation.voteSettings as Prisma.InputJsonValue
            }
          })
        ])
      }
      current++;
      console.log(`Updated ${current} vote strategies`);
    } catch (error) {
      current++;
      console.error(
        `Error updating vote strategy for proposal evaluation ${voteProposalEvaluation.id} ${current}: ${error}`
      );
    }
  }
}
updateVoteStrategy().catch(console.error);
