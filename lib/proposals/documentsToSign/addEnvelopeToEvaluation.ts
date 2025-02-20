import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { lowerCaseEqual } from '@packages/utils/strings';
import { getEnvelope } from '@root/lib/docusign/api';
import { getSpaceDocusignCredentials } from '@root/lib/docusign/getSpaceDocusignCredentials';
import { userByEmailOrGoogleAccountQuery } from '@root/lib/profile/getUser';

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

  const completedUserEmails = signersFromDocusign
    .filter((signer) => !!signer.signedDateTime)
    .map((signer) => signer.email);

  const usersWhoFinishedSigning = await prisma.user.findMany({
    where: userByEmailOrGoogleAccountQuery(completedUserEmails),
    select: {
      id: true,
      verifiedEmails: {
        where: {
          email: {
            in: completedUserEmails
          }
        }
      },
      googleAccounts: {
        where: {
          email: {
            in: completedUserEmails
          }
        }
      }
    }
  });

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
        const signerInDb = documentFromDb.signers.find((s) => lowerCaseEqual(s.email, signer.email));

        if (!signerInDb) {
          await tx.documentSigner.create({
            data: {
              email: signer.email.toLowerCase(),
              name: signer.name,
              documentToSign: { connect: { id: documentFromDb.id } }
            }
          });
        } else if (signerInDb && signer.signedDateTime && !signerInDb.completedAt) {
          const existingUser = usersWhoFinishedSigning.find(
            (u) =>
              u.googleAccounts.some((acc) => lowerCaseEqual(acc.email, signer.email.toLowerCase())) ||
              u.verifiedEmails.some((acc) => lowerCaseEqual(acc.email, signer.email.toLowerCase()))
          )?.id;

          await tx.documentSigner.update({
            where: {
              id: signerInDb.id
            },
            data: {
              completedAt: new Date(signer.signedDateTime),
              completedByUser: existingUser ? { connect: { id: existingUser } } : undefined
            }
          });
        }
      }
    });

    if (docusignEnvelope.status === 'completed') {
      return prisma.documentToSign.update({
        where: {
          id: documentFromDb.id
        },
        data: {
          status: 'completed'
        },
        include: {
          signers: true
        }
      });
    } else {
      return prisma.documentToSign.findUniqueOrThrow({
        where: {
          id: documentFromDb.id
        },
        include: {
          signers: true
        }
      });
    }
    // Reach logic branch if document is not in the database
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
            data: signersFromDocusign.map((signer) => ({
              email: signer.email.toLowerCase(),
              name: signer.name,
              completedAt: signer.signedDateTime ? new Date(signer.signedDateTime) : null,
              completedBy:
                usersWhoFinishedSigning.find(
                  (u) =>
                    u.googleAccounts.some((acc) => lowerCaseEqual(acc.email, signer.email.toLowerCase())) ||
                    u.verifiedEmails.some((acc) => lowerCaseEqual(acc.email, signer.email.toLowerCase()))
                )?.id || null
            }))
          }
        }
      },
      include: {
        signers: true
      }
    });
  }
}
