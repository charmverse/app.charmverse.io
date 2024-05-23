import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getEnvelope } from 'lib/docusign/api';
import { onError, onNoMatch } from 'lib/middleware';
import type { NextApiRequestWithApiPageKey } from 'lib/middleware/requireApiPageKey';
import { passDocumentEvaluationStepIfNecessary } from 'lib/proposals/documentsToSign/passDocumentStepIfNecessary';
import { userByEmailOrGoogleAccountQuery } from 'lib/users/getUser';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(docusignEventHandler);

// Base type
interface DocusignWebhookEvent {
  event: string;
  uri: string;
  retryCount: number | string;
  configurationId: number | string;
  apiVersion: string;
  generatedDateTime: string;
  data: {
    accountId: string;
    envelopeId: string;
    userId: string;
  };
}

// EnvelopeCompletedEvent extends DocusignWebhookEvent
interface EnvelopeCompletedEvent extends DocusignWebhookEvent {
  event: 'envelope-completed';
  data: {
    accountId: string;
    envelopeId: string;
    userId: string;
    envelopeSummary: string;
  };
}

// RecipientCompletedEvent extends DocusignWebhookEvent
interface RecipientCompletedEvent extends DocusignWebhookEvent {
  event: 'recipient-completed';
  retryCount: number;
  configurationId: number;
  data: {
    accountId: string;
    envelopeId: string;
    userId: string;
    recipientId: string;
  };
}

export async function docusignEventHandler(req: NextApiRequestWithApiPageKey, res: NextApiResponse) {
  const event = req.body as RecipientCompletedEvent | EnvelopeCompletedEvent;

  if (event.event !== 'envelope-completed' && event.event !== 'recipient-completed') {
    return res.status(200).end();
  }

  const docusignKey = req.query.docusignWebhookKey as string;

  const spaceCredentials = await prisma.docusignCredential.findUnique({
    where: {
      webhookApiKey: docusignKey
    }
  });

  if (!spaceCredentials) {
    return res.status(200).end();
  }

  const documentInDb = await prisma.documentToSign.findFirst({
    where: {
      docusignEnvelopeId: event.data.envelopeId,
      space: {
        id: spaceCredentials.spaceId
      }
    }
  });

  if (!documentInDb) {
    return res.status(200).end();
  }

  const envelope = await getEnvelope({ envelopeId: event.data.envelopeId, credentials: spaceCredentials });

  const envelopeSigners = envelope.recipients.signers;

  if (event.event === 'recipient-completed') {
    const completedSigner = envelopeSigners.find((signer) => signer.recipientId === event.data.recipientId);

    if (completedSigner) {
      const signerInDb = await prisma.documentSigner.findFirst({
        where: {
          email: completedSigner.email.toLowerCase(),
          documentToSign: {
            docusignEnvelopeId: event.data.envelopeId
          }
        }
      });

      const user = await prisma.user.findFirst({
        where: userByEmailOrGoogleAccountQuery(completedSigner.email)
      });

      if (signerInDb) {
        await prisma.documentSigner.update({
          where: {
            id: signerInDb.id
          },
          data: {
            completedAt: new Date(),
            completedByUser: user
              ? {
                  connect: {
                    id: user.id
                  }
                }
              : undefined
          }
        });
      } else {
        await prisma.documentSigner.create({
          data: {
            email: completedSigner.email.trim().toLowerCase(),
            name: completedSigner.name,
            documentToSign: {
              connect: {
                id: documentInDb.id
              }
            },
            completedAt: new Date(),
            completedByUser: user
              ? {
                  connect: {
                    id: user.id
                  }
                }
              : undefined
          }
        });
      }
    }
  } else if (event.event === 'envelope-completed') {
    const usersToMarkAsComplete = await prisma.documentSigner.findMany({
      where: {
        documentToSignId: documentInDb.id,
        completedAt: null
      }
    });

    await prisma.$transaction(async (tx) => {
      for (const signer of usersToMarkAsComplete) {
        const user = await tx.user.findFirst({
          where: userByEmailOrGoogleAccountQuery(signer.email)
        });

        await tx.documentSigner.update({
          where: {
            id: signer.id
          },
          data: {
            completedAt: new Date(),
            completedByUser: {
              connect: user
                ? {
                    id: user.id
                  }
                : undefined
            }
          }
        });

        await tx.documentToSign.update({
          where: {
            id: documentInDb.id
          },
          data: {
            completedAt: new Date(),
            status: 'completed'
          }
        });
      }

      await passDocumentEvaluationStepIfNecessary({
        evaluationId: documentInDb.evaluationId
      });
    });
  }

  return res.status(200).json({ success: true });
}

export default handler;
