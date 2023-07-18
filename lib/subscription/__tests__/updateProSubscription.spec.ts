import type { Space } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { InvalidStateError } from 'lib/middleware';
import { getSpaceAndSubscription } from 'testing/getSpaceSubscription';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { stripeMock, stripeMockIds } from 'testing/stripeMock';
import { addSpaceSubscription } from 'testing/utils/spaces';

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
      }
    };

    (stripeClient.subscriptions.retrieve as jest.Mock) = jest.fn().mockResolvedValue(stripeSubscriptionDetails);
    (stripeClient.subscriptions.update as jest.Mock) = stripeMock.stripeClient.subscriptions.update;
    (stripeClient.customers.update as jest.Mock) = stripeMock.stripeClient.customers.update;

    await updateProSubscription({
      spaceId,
      payload: { subscriptionId, billingEmail: 'test@gmail.com', status: 'cancel_at_end' }
    });
  });
  it(`Should fail if the subscription has no spaceId or other spaceId`, async () => {
    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;
    const spaceId = space.id;

    const stripeSubscriptionDetails = {
      id: subscriptionId,
      status: 'active',
      metadata: {},
      customer: {
        id: customerId,
        deleted: undefined,
        metadata: {
          spaceId
        }
      }
    };

    (stripeClient.subscriptions.retrieve as jest.Mock) = jest.fn().mockResolvedValue(stripeSubscriptionDetails);
    (stripeClient.subscriptions.update as jest.Mock) = stripeMock.stripeClient.subscriptions.update;
    (stripeClient.customers.update as jest.Mock) = stripeMock.stripeClient.customers.update;

    await expect(
      updateProSubscription({
        spaceId,
        payload: { subscriptionId }
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
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
      }
    };

    (stripeClient.subscriptions.retrieve as jest.Mock) = jest.fn().mockResolvedValue(stripeSubscriptionDetails);
    (stripeClient.subscriptions.update as jest.Mock) = stripeMock.stripeClient.subscriptions.update;
    (stripeClient.customers.update as jest.Mock) = stripeMock.stripeClient.customers.update;

    await expect(
      updateProSubscription({
        spaceId,
        payload: { subscriptionId }
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it(`Should fail if the stripe subscription is not active`, async () => {
    const customerId = `cus_${v4()}`;
    const subscriptionId = `sub_${v4()}`;
    const spaceId = space.id;

    const stripeSubscriptionDetails = {
      id: subscriptionId,
      status: 'incomplete',
      metadata: {
        spaceId
      },
      customer: {
        id: customerId,
        metadata: {
          spaceId
        }
      }
    };

    (stripeClient.subscriptions.retrieve as jest.Mock) = jest.fn().mockResolvedValue(stripeSubscriptionDetails);
    (stripeClient.subscriptions.update as jest.Mock) = stripeMock.stripeClient.subscriptions.update;
    (stripeClient.customers.update as jest.Mock) = stripeMock.stripeClient.customers.update;

    await expect(
      updateProSubscription({
        spaceId,
        payload: { subscriptionId }
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
});
