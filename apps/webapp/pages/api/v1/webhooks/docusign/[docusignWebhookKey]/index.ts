import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import type { DocusignEnvelope } from '@packages/lib/docusign/api';
import { getEnvelope, setEnvelopeInCache } from '@packages/lib/docusign/api';
import { onError, onNoMatch } from '@packages/lib/middleware';
import type { NextApiRequestWithApiPageKey } from '@packages/lib/middleware/requireApiPageKey';
import { passDocumentEvaluationStepIfNecessaryOrReopenEvaluation } from '@packages/lib/proposals/documentsToSign/passDocumentEvaluationStepIfNecessaryOrReopenEvaluation';
import { userByEmailOrGoogleAccountQuery } from '@packages/profile/getUser';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(docusignEventHandler);

// Base type
type DocusignWebhookEvent<E extends string, T> = {
  event: E;
  uri: string;
  retryCount: number | string;
  configurationId: number | string;
  apiVersion: string;
  generatedDateTime: string;
  data: T;
};

// EnvelopeCompletedEvent extends DocusignWebhookEvent
type EnvelopeCompletedEvent = DocusignWebhookEvent<
  'envelope-completed',
  {
    accountId: string;
    envelopeId: string;
    userId: string;
    envelopeSummary: string;
  }
>;

// RecipientCompletedEvent extends DocusignWebhookEvent
type RecipientCompletedEvent = DocusignWebhookEvent<
  'recipient-completed',
  {
    accountId: string;
    envelopeId: string;
    userId: string;
    recipientId: string;
  }
>;

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
    log.info('Received docusign webhook request with unknown key');
    return res.status(200).end();
  }

  log.info('Received docusign webhook request', {
    spaceId: spaceCredentials.spaceId,
    event: event.event,
    docusignEnvelopeId: event.data.envelopeId
  });

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
    const completedSignerIndex = envelopeSigners.findIndex((signer) => signer.recipientId === event.data.recipientId);

    const completedSigner = envelopeSigners[completedSignerIndex];

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

      const refreshedEnvelope: DocusignEnvelope = {
        ...envelope,
        recipients: {
          ...envelope.recipients,
          signers: envelopeSigners.map((signer, index) => {
            if (index === completedSignerIndex) {
              return {
                ...signer,
                signedDateTime: new Date().toISOString()
              };
            }

            return signer;
          })
        }
      };

      await setEnvelopeInCache(refreshedEnvelope);
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
      }

      await tx.documentToSign.update({
        where: {
          id: documentInDb.id
        },
        data: {
          completedAt: new Date(),
          status: 'completed'
        }
      });

      await passDocumentEvaluationStepIfNecessaryOrReopenEvaluation({
        evaluationId: documentInDb.evaluationId,
        tx
      });
    });

    await setEnvelopeInCache({ ...envelope, status: 'completed' });
  }

  return res.status(200).json({ success: true });
}

export default handler;
