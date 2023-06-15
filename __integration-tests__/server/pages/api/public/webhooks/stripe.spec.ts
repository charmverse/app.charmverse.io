import Stripe from 'stripe';
import request from 'supertest';

import { stripeClient } from 'lib/subscription/stripe';
import { baseUrl } from 'testing/mockApiCall';

jest.mock('lib/subscription/stripe', () => ({
  stripeClient: {
    webhooks: {
      constructEvent: jest.fn()
    }
  }
}));

const _stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  host: 'localhost',
  protocol: 'http',
  port: 12111,
  apiVersion: '2022-11-15'
});

describe('POST api/v1/webhooks/stripe - Catch events from Stripe', () => {
  it('should update the subscription status', async () => {
    const payload = {
      id: 'evt_1NIulWCoqmaE6diLjyGS6Aqd',
      object: 'event',
      api_version: '2020-08-27',
      created: 1686753221,
      data: {
        object: {
          id: 'in_1NIulTCoqmaE6diLsOhsPLqc',
          object: 'invoice',
          status: 'paid',
          subscription: 'sub_1NIulTCoqmaE6diLL1q3pNsL',
          subtotal: 1000,
          subtotal_excluding_tax: 1000,
          tax: null,
          test_clock: null,
          total: 1000,
          total_discount_amounts: [],
          total_excluding_tax: 1000,
          total_tax_amounts: [],
          transfer_data: null,
          webhooks_delivered_at: null
        }
      },
      livemode: false,
      pending_webhooks: 3,
      request: {
        id: 'req_TKLwTS8ey0C3iU',
        idempotency_key: '4104b812-c196-47d4-a0b6-f40ee7499261'
      },
      type: 'invoice.paid'
    };

    const payloadString = JSON.stringify(payload, null, 2);
    const secret = process.env.STRIPE_WEBHOOK_SECRET as string;

    const header = _stripeClient.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret
    });

    const event = _stripeClient.webhooks.constructEvent(payloadString, header, secret);

    const constructEventMockFn = jest.fn().mockResolvedValue(event);
    (stripeClient.webhooks.constructEvent as jest.Mock<any, any>) = constructEventMockFn;

    const response = await request(baseUrl)
      .post('/api/v1/webhooks/stripe')
      .set('stripe-signature', header)
      .set('content-type', 'application/json; charset=utf-8')
      .send(payload)
      .expect(400);

    // Do something with mocked signed event
    expect(event.id).toEqual(payload.id);
  });
});
