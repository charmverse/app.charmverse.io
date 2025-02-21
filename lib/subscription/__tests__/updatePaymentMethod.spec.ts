import { stripeMock, stripeMockIds } from '@packages/testing/stripeMock';

import { stripeClient } from '../stripe';
import { updatePaymentMethod } from '../updatePaymentMethod';

jest.doMock('../stripe', () => ({ ...stripeMock }));

describe('updatePaymentMethod', () => {
  it(`Should return a client secret if the card has an required action to be made`, async () => {
    (stripeClient.customers.update as jest.Mock) = stripeMock.stripeClient.customers.update;
    (stripeClient.subscriptions.update as jest.Mock) = stripeMock.stripeClient.subscriptions.update;

    await expect(
      updatePaymentMethod({
        customerId: stripeMockIds.customerId,
        paymentMethodId: stripeMockIds.paymentId,
        subscriptionId: stripeMockIds.subscriptionId
      })
    ).resolves.not.toThrow();
  });
});
