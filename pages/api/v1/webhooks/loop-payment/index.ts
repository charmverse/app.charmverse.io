import { InsecureOperationError } from '@charmverse/core';
import { loop } from '@loop-crypto/loop-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';

import { requireKeys } from 'lib/middleware';
import { defaultHandler } from 'lib/public-api/handler';

const handler = defaultHandler();

handler.use(requireKeys(['contractAddress', 'event', 'networkId'], 'body')).post(loopPayment);

/**
 * @swagger
 * /loop-payment/:
 *   post:
 *     summary: Create/Update a subscription from a Loop event.
 *     description: We will receive an event and depending on type we will update the db.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *               oneOf:
 *                  - type: object
 *                    properties:
 *                       [key: string]:
 *                          type: string
 *                  - type: string
 *     responses:
 *       200:
 *         description: Update succeeded
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Subcsription'
 */
export async function loopPayment(req: NextApiRequest, res: NextApiResponse) {
  // console.log('req', req);
  const signature = req.headers['loop-signature'];

  if (!signature) {
    throw new InsecureOperationError('Signature not found');
  }

  const validWebhook = loop.verifyWebhook(req.body, signature as string);

  if (!validWebhook) {
    throw new Error('Invalid request signature');
  }
  const body = JSON.parse(req.body);
  const { event: webhookType, networkId, contractAddress } = body;
  // console.log(`Handling incoming webhook event: ${webhookType}`);

  if (networkId !== process.env.LOOP_CONTRACT_NETWORK_ID) {
    throw new Error('Mismatched network ID');
  }
  if (
    contractAddress.toLowerCase() !== ((process.env.LOOP_CONTRACT_ADDRESS as string | undefined) || '').toLowerCase()
  ) {
    throw new Error('Mismatched contract address');
  }
  // Handle each webhook type
  switch (webhookType) {
    case 'AgreementSignedUp':
      // await handleSignup(body);
      break;
    case 'AgreementCancelled':
      // await handleCancel(body);
      break;
    case 'TransferProcessed':
      // await handleTransferProcessed(body);
      break;
    case 'LatePayment':
      // await handleLatePayment(body);
      break;
    default:
      break;
  }

  return res.status(200).end();
}

export default handler;
