import { prisma, type DocumentSigner, type DocumentToSign } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

export type DocumentWithSigners = DocumentToSign & {
  signers: DocumentSigner[];
};

export async function getProposalDocumentsToSign({
  proposalId
}: {
  proposalId: string;
}): Promise<Record<string, DocumentWithSigners[]>> {
  if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError('Invalid proposal ID');
  }

  const docs = await prisma.documentToSign.findMany({
    where: {
      proposalId
    },
    include: {
      signers: true
    }
  });

  const documents = docs.reduce(
    (acc, doc) => {
      const evaluationId = doc.evaluationId;

      if (!acc[evaluationId]) {
        acc[evaluationId] = [];
      }

      acc[evaluationId].push(doc);

      return acc;
    },
    {} as Record<string, DocumentWithSigners[]>
  );

  return documents;
}
