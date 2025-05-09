import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import type { EvaluationDocumentToSign } from './addEnvelopeToEvaluation';

export async function removeEnvelopeFromEvaluation({
  envelopeId,
  evaluationId
}: EvaluationDocumentToSign): Promise<void> {
  if (!envelopeId || !evaluationId) {
    throw new InvalidInputError('envelopeId and evaluationId are required');
  }

  const documentToSign = await prisma.documentToSign.findFirst({
    where: {
      docusignEnvelopeId: envelopeId,
      evaluationId
    }
  });

  if (documentToSign) {
    await prisma.documentToSign.delete({
      where: {
        id: documentToSign.id
      }
    });
  }
}
