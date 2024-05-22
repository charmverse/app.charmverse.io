import { InvalidInputError } from '@charmverse/core/errors';
import { prisma, type DocumentSigner, type DocumentToSign } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { getEnvelope, type DocusignEnvelope } from 'lib/docusign/api';
import { getSpaceDocusignCredentials } from 'lib/docusign/authentication';

export type DocumentWithSigners = DocumentToSign & {
  signers: DocumentSigner[];
};

export type ProposalDocumentWithEnvelope = {
  document: DocumentWithSigners;
  envelope: DocusignEnvelope;
};

export async function getProposalDocuments({
  proposalId
}: {
  proposalId: string;
}): Promise<Record<string, ProposalDocumentWithEnvelope[]>> {
  if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError('Invalid proposal ID');
  }

  const { spaceId } = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    select: {
      spaceId: true
    }
  });

  const credentials = await getSpaceDocusignCredentials({ spaceId });

  const docs = await prisma.documentToSign.findMany({
    where: {
      proposalId
    },
    include: {
      signers: true
    }
  });

  const envelopes = await Promise.all(
    docs.map((doc) => getEnvelope({ envelopeId: doc.docusignEnvelopeId, credentials }))
  );

  const documents = docs.reduce((acc, doc) => {
    const envelope = envelopes.find((e) => e.envelopeId === doc.docusignEnvelopeId);

    if (!envelope) {
      return acc;
    }

    const evaluationId = doc.evaluationId;

    if (!acc[evaluationId]) {
      acc[evaluationId] = [];
    }

    acc[evaluationId].push({ document: doc, envelope });

    return acc;
  }, {} as Record<string, ProposalDocument[]>);

  return documents;
}
