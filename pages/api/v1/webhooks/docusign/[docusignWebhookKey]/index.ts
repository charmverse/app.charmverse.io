import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getEnvelope } from 'lib/docusign/api';
import { onError, onNoMatch } from 'lib/middleware';
import type { NextApiRequestWithApiPageKey } from 'lib/middleware/requireApiPageKey';
import { prettyPrint } from 'lib/utils/strings';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(docusignEventHandler);

type RecipientCompletedEvent = {
  event: 'recipient-completed';
  apiVersion: 'v2.1';
  uri: string;
  retryCount: number;
  configurationId: number;
  generatedDateTime: string;
  data: {
    accountId: string;
    userId: string;
    envelopeId: string;
    recipientId: string;
  };
};

export async function docusignEventHandler(req: NextApiRequestWithApiPageKey, res: NextApiResponse) {
  const docusignKey = req.query.docusignWebhookKey as string;

  const space = await prisma.docusignCredential.findUnique({
    where: {
      webhookApiKey: docusignKey
    }
  });

  const event = req.body as RecipientCompletedEvent;

  // if (event.event === 'recipient-completed') {
  //   const envelope = await getEnvelope({ envelopeId: event.data.envelopeId, spaceId: space?.spaceId });
  // }

  prettyPrint({
    space,
    event: req.body
  });

  return res.status(200).json({ success: true });
}

export default handler;
