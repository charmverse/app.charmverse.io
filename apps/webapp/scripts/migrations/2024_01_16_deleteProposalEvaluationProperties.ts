import { prisma } from '@charmverse/core/prisma-client';
import { BoardFields } from '@packages/databases/board';

async function deleteProposalEvaluationProperties() {
  const proposalBoardBlocks = await prisma.block.findMany({
    where: {
      type: 'board',
      fields: {
        path: ['sourceType'],
        equals: 'proposals'
      }
    },
    select: {
      id: true,
      fields: true
    }
  });

  const totalBoardBlocks = proposalBoardBlocks.length;
  let currentBlock = 0;
  for (const proposalBoardBlock of proposalBoardBlocks) {
    try {
      await prisma.block.update({
        where: {
          id: proposalBoardBlock.id
        },
        data: {
          fields: {
            ...(proposalBoardBlock.fields as unknown as BoardFields),
            cardProperties: ((proposalBoardBlock.fields as unknown as BoardFields).cardProperties ?? []).filter(
              (boardCardProperty) => {
                if (
                  boardCardProperty.type === 'proposalEvaluatedBy' &&
                  boardCardProperty.name === 'Proposal Evaluated By'
                ) {
                  return false;
                } else if (
                  boardCardProperty.type === 'proposalEvaluationAverage' &&
                  boardCardProperty.name === 'Proposal Evaluation Average'
                ) {
                  return false;
                } else if (
                  boardCardProperty.type === 'proposalEvaluationTotal' &&
                  boardCardProperty.name === 'Proposal Evaluation Total'
                ) {
                  return false;
                }
                return true;
              }
            )
          } as any
        }
      });
    } catch (_) {
      console.log(`Failed to update board block ${proposalBoardBlock.id}`);
    } finally {
      currentBlock++;
      console.log(`Updated ${currentBlock} of ${totalBoardBlocks} board blocks`);
    }
  }
}

deleteProposalEvaluationProperties();
