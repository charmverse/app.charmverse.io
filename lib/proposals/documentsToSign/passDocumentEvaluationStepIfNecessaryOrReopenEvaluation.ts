import { prisma, type Prisma } from '@charmverse/core/prisma-client';

export async function passDocumentEvaluationStepIfNecessaryOrReopenEvaluation({
  evaluationId,
  tx = prisma
}: {
  evaluationId: string;
  tx?: Prisma.TransactionClient;
}): Promise<void> {
  const evaluation = await tx.proposalEvaluation.findUniqueOrThrow({
    where: {
      id: evaluationId
    },
    select: {
      documentsToSign: true,
      result: true
    }
  });

  if (evaluation.documentsToSign.length) {
    const allDocumentsCompleted = evaluation.documentsToSign.every((doc) => doc.status === 'completed');

    if (allDocumentsCompleted) {
      await tx.proposalEvaluation.update({
        where: {
          id: evaluationId
        },
        data: {
          result: 'pass',
          completedAt: new Date()
        }
      });
    } else if (evaluation.result === 'pass') {
      await tx.proposalEvaluation.update({
        where: {
          id: evaluationId
        },
        data: {
          result: null,
          completedAt: null
        }
      });
    }
  }
}
