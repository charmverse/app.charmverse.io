import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { getEnvelope } from 'lib/docusign/api';
import { getSpaceDocusignCredentials } from 'lib/docusign/authentication';
import { lowerCaseEqual } from 'lib/utils/strings';

import type { DocumentWithSigners } from './getProposalDocumentsToSign';

export type EvaluationDocumentToSign = {
  evaluationId: string;
  envelopeId: string;
};

export async function addEnvelopeToEvaluation({
  envelopeId,
  evaluationId
}: EvaluationDocumentToSign): Promise<DocumentWithSigners> {
  if (!envelopeId || !evaluationId) {
    throw new InvalidInputError('envelopeId and evaluationId are required');
  }

  const evaluation = await prisma.proposalEvaluation.findUniqueOrThrow({
    where: {
      id: evaluationId
    },
    select: {
      proposal: {
        select: {
          id: true,
          spaceId: true
        }
      }
    }
  });

  const docusignCredentials = await getSpaceDocusignCredentials({
    spaceId: evaluation.proposal.spaceId
  });

  const docusignEnvelope = await getEnvelope({
    envelopeId,
    credentials: docusignCredentials
  });

  const signersFromDocusign = docusignEnvelope.recipients.signers;

  const documentFromDb = await prisma.documentToSign.findFirst({
    where: {
      evaluationId,
      docusignEnvelopeId: envelopeId
    },
    select: {
      id: true,
      signers: true
    }
  });

  if (documentFromDb) {
    await prisma.$transaction(async (tx) => {
      // Remove any signers that are no longer in the envelope
      for (const signer of documentFromDb.signers) {
        if (!signersFromDocusign.find((s) => lowerCaseEqual(s.email, signer.email))) {
          await tx.documentSigner.delete({
            where: {
              id: signer.id
            }
          });
        }
      }

      // Add new signers
      for (const signer of signersFromDocusign) {
        if (!documentFromDb.signers.find((s) => lowerCaseEqual(s.email, signer.email))) {
          await tx.documentSigner.create({
            data: {
              email: signer.email.toLowerCase(),
              name: signer.name,
              documentToSign: { connect: { id: documentFromDb.id } }
            }
          });
        }
      }
    });

    return prisma.documentToSign.findUniqueOrThrow({
      where: {
        id: documentFromDb.id
      },
      include: {
        signers: true
      }
    });
  } else {
    return prisma.documentToSign.create({
      data: {
        evaluation: { connect: { id: evaluationId } },
        proposal: { connect: { id: evaluation.proposal.id } },
        docusignEnvelopeId: envelopeId,
        status: docusignEnvelope.status === 'completed' ? 'completed' : 'pending',
        title: docusignEnvelope.emailSubject,
        space: { connect: { id: evaluation.proposal.spaceId } },
        signers: {
          createMany: {
            data: signersFromDocusign.map((signer) => ({ email: signer.email.toLowerCase(), name: signer.name }))
          }
        }
      },
      include: {
        signers: true
      }
    });
  }
}
