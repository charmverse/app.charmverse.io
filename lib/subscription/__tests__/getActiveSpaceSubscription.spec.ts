import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { addSpaceSubscription } from 'testing/utils/spaces';

import { getActiveSpaceSubscription, subscriptionExpandFields } from '../getActiveSpaceSubscription';
import { stripeClient } from '../stripe';

import { stripeSubscriptionStub } from './stripeStubs';

jest.mock('../stripe', () => ({
  stripeClient: {
    customers: {
      create: jest.fn(),
      list: jest.fn()
    },
    products: {
      retrieve: jest.fn()
    },
    prices: {
      list: jest.fn()
    },
    subscriptions: {
      create: jest.fn(),
      search: jest.fn(),
      retrieve: jest.fn()
    },
    billingPortal: {
      sessions: {
        create: jest.fn()
      }
    }
  }
}));

describe('getActiveSpaceSubscription', () => {
  it(`Should return null if space subscription doesn't exist`, async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const spaceSubscription = await getActiveSpaceSubscription({ spaceId: space.id });

    expect(spaceSubscription).toBeNull();
  });

  it(`Should return null if space subscription is marked as cancelled in Stripe`, async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;

    await addSpaceSubscription({
      spaceId: space.id,
      subscriptionId,
      customerId
    });

    const subscriptionStub = stripeSubscriptionStub({
      // The important piece
      status: 'canceled',
      customerId,
      subscriptionId,
      interval: 'month'
    });

    (stripeClient.subscriptions.retrieve as jest.Mock).mockResolvedValueOnce(subscriptionStub);

    const spaceSubscription = await getActiveSpaceSubscription({ spaceId: space.id });

    expect(spaceSubscription).toBeNull();
  });

  it(`Should return space subscription metadata`, async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;

    await addSpaceSubscription({
      spaceId: space.id,
      subscriptionId,
      customerId
    });

    const subscriptionStub = stripeSubscriptionStub({
      status: 'active',
      customerId,
      subscriptionId,
      interval: 'month'
    });

    (stripeClient.subscriptions.retrieve as jest.Mock).mockResolvedValueOnce(subscriptionStub);

    const spaceSubscription = await getActiveSpaceSubscription({ spaceId: space.id });

    expect(spaceSubscription).toMatchObject(
      expect.objectContaining({
        subscriptionId,
        period: 'monthly',
        spaceId: space.id
      })
    );
  });

  it('should request details for customer and default_payment_method', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;

    await addSpaceSubscription({
      spaceId: space.id,
      customerId,
      subscriptionId
    });

    expect(subscriptionExpandFields).toEqual(['customer', 'default_payment_method']);

    const subscriptionStub = stripeSubscriptionStub({ status: 'active' });

    (
      stripeClient.subscriptions.retrieve as jest.Mock<ReturnType<(typeof stripeClient)['subscriptions']['retrieve']>>
    ).mockResolvedValueOnce(subscriptionStub as any);

    await getActiveSpaceSubscription({ spaceId: space.id });

    expect(stripeClient.subscriptions.retrieve).toHaveBeenCalledWith(subscriptionId, {
      expand: subscriptionExpandFields
    });
  });

  it('should only request a link to the billing portal if this is requested, and pass the return url to the payment method', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;

    await addSpaceSubscription({
      spaceId: space.id,
      customerId,
      subscriptionId
    });

    const subscriptionStub = stripeSubscriptionStub({ status: 'active', customerId, subscriptionId });
    // Check the function is not called

    (stripeClient.subscriptions.retrieve as jest.Mock).mockResolvedValueOnce(subscriptionStub);

    const subscriptionWithoutReturnUrl = await getActiveSpaceSubscription({ spaceId: space.id });

    expect(stripeClient.billingPortal.sessions.create).not.toHaveBeenCalled();

    expect(subscriptionWithoutReturnUrl?.paymentMethod?.updateUrl).toBeUndefined();

    // Check the function is called when parameter is passed
    (stripeClient.subscriptions.retrieve as jest.Mock).mockResolvedValueOnce(subscriptionStub);

    const billingPortalReturnUrl = 'www.example.com';

    (stripeClient.billingPortal.sessions.create as jest.Mock).mockResolvedValueOnce({ url: billingPortalReturnUrl });

    const subscriptionWithReturnUrl = await getActiveSpaceSubscription({
      spaceId: space.id,
      returnUrl: billingPortalReturnUrl,
      requestCustomerPortal: true
    });

    expect(stripeClient.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: customerId,
      return_url: billingPortalReturnUrl
    });

    expect(subscriptionWithReturnUrl?.paymentMethod?.updateUrl).toEqual(billingPortalReturnUrl);
  });
});
