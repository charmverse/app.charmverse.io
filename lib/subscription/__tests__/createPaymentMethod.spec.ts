import { stripeMock, stripeMockIds } from '@packages/testing/stripeMock';

import { createPaymentMethod } from '../createPaymentMethod';
import { stripeClient } from '../stripe';

jest.doMock('../stripe', () => ({ ...stripeMock }));

describe('createPaymentMethod', () => {
  it(`Should return a client secret if the card has an required action to be made`, async () => {
    const confirmedSetupIntentResponse = jest.fn().mockResolvedValue({
      id: stripeMockIds.setupIntentId,
      paymentMethodId: stripeMockIds.paymentMethodId,
      clientSecret: 'client_secret',
      status: 'requires_action'
    });

    (stripeClient.setupIntents.create as jest.Mock) = stripeMock.stripeClient.setupIntents.create;
    (stripeClient.setupIntents.confirm as jest.Mock) = confirmedSetupIntentResponse;

    const intent = await createPaymentMethod({
      customerId: stripeMockIds.customerId,
      paymentMethodId: stripeMockIds.paymentId
    });

    expect(intent?.clientSecret).not.toBeNull();
  });
  it(`Should return null if no action is required for the user`, async () => {
    (stripeClient.setupIntents.create as jest.Mock) = stripeMock.stripeClient.setupIntents.create;
    (stripeClient.setupIntents.confirm as jest.Mock) = stripeMock.stripeClient.setupIntents.confirm;
    const intent = await createPaymentMethod({
      customerId: stripeMockIds.customerId,
      paymentMethodId: stripeMockIds.paymentId
    });

    expect(intent).toBeNull();
  });
});
