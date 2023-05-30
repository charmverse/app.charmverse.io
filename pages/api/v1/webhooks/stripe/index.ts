import { InsecureOperationError } from '@charmverse/core';
import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';

import { stripeClient } from 'lib/subscription/stripe';

export const config = {
  api: {
    bodyParser: false
  }
};

const buffer = (req: NextApiRequest) => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', reject);
  });
};

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!webhookSecret) {
    throw new InsecureOperationError('Stripe webhook secret not found');
  }

  if (!signature) {
    throw new InsecureOperationError('Signature not found');
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST').status(405).end('Method Not Allowed');
  }

  try {
    const body = await buffer(req);
    const event: Stripe.Event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
    // console.log('event', event);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const stripeObject: Stripe.PaymentIntent = event.data.object as Stripe.PaymentIntent;
        // console.log(`💰 PaymentIntent status: ${stripeObject.status}`);
        break;
      }
      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge;
        // console.log(`💵 Charge id: ${charge.id}`);
        break;
      }
      default: {
        log.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
        break;
      }
    }

    res.status(200).end();
  } catch (err: any) {
    log.warn('Stripe webhook failed to construct event', err);
    res.status(400).send(encodeURI(`Webhook Error: ${err?.message}`));
  }
};

export default handler;
