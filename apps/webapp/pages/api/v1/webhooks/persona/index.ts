import { Buffer } from 'node:buffer';

import { prisma } from '@charmverse/core/prisma-client';
import { InsecureOperationError, DataNotFoundError } from '@packages/core/errors';
import { log } from '@packages/core/log';
import type { PersonaEventData } from '@packages/lib/kyc/persona/interfaces';
import { checkSignature } from '@packages/lib/kyc/persona/webhook/checkSignature';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { relay } from '@packages/websockets/relay';
import type { NextApiRequest, NextApiResponse } from 'next';

import { defaultHandler } from 'lib/public-api/handler';

export const config = { api: { bodyParser: false } };

function buffer(req: NextApiRequest) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    req.on('error', reject);
  });
}

const handler = defaultHandler();

handler.post(personaHandler);

export async function personaHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    const rawBody = await buffer(req);
    const signature = req.headers['persona-signature'] as string | undefined;

    if (!signature) {
      throw new InsecureOperationError('Persona Signature not present in the headers');
    }

    const body = JSON.parse(rawBody) as PersonaEventData;
    const data = body?.data;
    const eventType = data?.attributes?.name;
    const inquiryId = data?.attributes?.payload?.data?.id;

    if (eventType.startsWith('inquiry')) {
      const personaUserKyc = await prisma.personaUserKyc.findFirst({
        where: {
          inquiryId
        }
      });

      if (!personaUserKyc) {
        throw new DataNotFoundError(`Persona user kyc not found with inquiry id ${inquiryId}`);
      }

      const spaceId = personaUserKyc.spaceId;

      const personaCredential = await prisma.personaCredential.findUnique({
        where: {
          spaceId
        }
      });

      if (!personaCredential?.apiKey) {
        throw new DataNotFoundError(`Persona API key not found for space ${spaceId}`);
      }

      if (!personaCredential?.secret) {
        throw new DataNotFoundError(`Space does not have a Persona secret ${spaceId}`);
      }

      const checkedSignature = checkSignature({
        body: rawBody,
        signature,
        secret: personaCredential.secret
      });

      if (checkedSignature === false) {
        throw new DataNotFoundError(`Persona signature not valid for space ${spaceId}`);
      }

      await prisma.personaUserKyc.update({
        where: {
          id: personaUserKyc.id
        },
        data: {
          status: data?.attributes?.payload?.data?.attributes?.status
        }
      });

      log.info(`Persona event processed for user kyc ${personaUserKyc.id}`);
    }

    return res.status(200).json({});
  } catch (err: any) {
    log.warn('Persona webhook failed', err);
    return res.status(400).json(`Webhook Error: ${err?.message}`);
  }
}

export default handler;
