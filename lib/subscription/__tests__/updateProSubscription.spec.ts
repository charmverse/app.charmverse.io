import type { Space } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { InvalidStateError } from '@packages/nextjs/errors';
import { stripeMock, stripeMockIds } from '@packages/testing/stripeMock';
import { addSpaceSubscription } from '@packages/testing/utils/spaces';
import { v4 } from 'uuid';

import { stripeClient } from '../stripe';
import { updateProSubscription } from '../updateProSubscription';

jest.doMock('../stripe', () => ({ ...stripeMock }));

describe('updateProSubscription', () => {
  let space: Space;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    space = generated.space;
  });

  it(`Should update an active stripe subscription`, async () => {
    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;
    const spaceId = space.id;

    const stripeSubscriptionDetails = {
      id: subscriptionId,
      status: 'active',
      metadata: {
        spaceId
      },
      customer: {
        id: customerId,
        deleted: undefined,
        metadata: {
          spaceId
        }
      },
      items: {
        data: [
          {
            price: stripeMockIds.priceId,
            quantity: 10
          }
        ]
      }
    };

    (stripeClient.subscriptions.retrieve as jest.Mock) = jest.fn().mockResolvedValue(stripeSubscriptionDetails);
    (stripeClient.subscriptions.update as jest.Mock) = stripeMock.stripeClient.subscriptions.update;
    (stripeClient.customers.update as jest.Mock) = stripeMock.stripeClient.customers.update;

    await addSpaceSubscription({
      spaceId,
      subscriptionId,
      customerId,
      deletedAt: null
    });

    await expect(
      updateProSubscription({
        spaceId,
        payload: { billingEmail: 'test@gmail.com', status: 'cancel_at_end' }
      })
    ).resolves.not.toThrow();
  });

  it(`Should fail if the space has no subscription`, async () => {
    const spaceId = v4();
    await expect(
      updateProSubscription({
        spaceId,
        payload: {}
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it(`Should fail if the space has a deleted subscription`, async () => {
    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;
    const { space: newSpace } = await testUtilsUser.generateUserAndSpace();
    const spaceId = newSpace.id;

    await addSpaceSubscription({
      spaceId,
      subscriptionId,
      customerId,
      deletedAt: new Date()
    });

    await expect(
      updateProSubscription({
        spaceId,
        payload: {}
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it(`Should fail if the subscription has no spaceId or other spaceId`, async () => {
    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;
    const spaceId = space.id;

    let stripeSubscriptionDetails = {
      id: subscriptionId,
      status: 'active',
      metadata: {},
      customer: {
        id: customerId,
        deleted: undefined,
        metadata: {
          spaceId
        }
      },
      items: {
        data: [
          {
            price: stripeMockIds.priceId,
            quantity: 10
          }
        ]
      }
    };

    (stripeClient.subscriptions.retrieve as jest.Mock) = jest.fn().mockResolvedValue(stripeSubscriptionDetails);
    (stripeClient.subscriptions.update as jest.Mock) = stripeMock.stripeClient.subscriptions.update;
    (stripeClient.customers.update as jest.Mock) = stripeMock.stripeClient.customers.update;

    await expect(
      updateProSubscription({
        spaceId,
        payload: {}
      })
    ).rejects.toBeInstanceOf(InvalidStateError);

    stripeSubscriptionDetails = {
      ...stripeSubscriptionDetails,
      metadata: { spaceId: v4() }
    };
  });

  it(`Should fail if the stripe customer is deleted`, async () => {
    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;
    const spaceId = space.id;

    const stripeSubscriptionDetails = {
      id: subscriptionId,
      status: 'active',
      metadata: {
        spaceId
      },
      customer: {
        id: customerId,
        deleted: true,
        metadata: {
          spaceId
        }
      },
      items: {
        data: [
          {
            price: stripeMockIds.priceId,
            quantity: 10
          }
        ]
      }
    };

    (stripeClient.subscriptions.retrieve as jest.Mock) = jest.fn().mockResolvedValue(stripeSubscriptionDetails);
    (stripeClient.subscriptions.update as jest.Mock) = stripeMock.stripeClient.subscriptions.update;
    (stripeClient.customers.update as jest.Mock) = stripeMock.stripeClient.customers.update;

    await expect(
      updateProSubscription({
        spaceId,
        payload: {}
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
});
