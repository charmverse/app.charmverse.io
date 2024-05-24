import { prisma, type Prisma } from '@charmverse/core/prisma-client';

export async function passDocumentEvaluationStepIfNecessary({
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
      documentsToSign: true
    }
  });

  if (evaluation.documentsToSign.length && evaluation.documentsToSign.every((doc) => doc.status === 'completed')) {
    await tx.proposalEvaluation.update({
      where: {
        id: evaluationId
      },
      data: {
        result: 'pass',
        completedAt: new Date()
      }
    });
  }
}
