import { InsecureOperationError } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';

import { NotFoundError } from 'lib/middleware';
import { defaultHandler } from 'lib/public-api/handler';
import { handleCryptoPayment } from 'lib/subscription/handleCryptoPayment';
import { coinbaseVerifyRoute } from 'lib/subscription/verifyCoinbase';

const handler = defaultHandler();

handler.post(coinbasePaymentWebhook);

/**
 * @swagger
 * /coinbase-payment/:
 *   post:
 *     summary: Create/Update a subscription from a Coinbase event.
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
export async function coinbasePaymentWebhook(req: NextApiRequest, res: NextApiResponse) {
  const rawBody = JSON.stringify(req.body);
  const signature = String(req.headers['x-cc-webhook-signature']);
  const webhookSecret = process.env.COINBASE_WEBHOOK_SECRET as string | undefined;

  if (!webhookSecret) {
    throw new NotFoundError('Webhook secret not found');
  }

  if (!signature) {
    throw new InsecureOperationError('Signature not found');
  }

  const event = await coinbaseVerifyRoute(rawBody, signature, webhookSecret);
  await handleCryptoPayment(event);

  return res.status(200).end();
}

export default handler;
