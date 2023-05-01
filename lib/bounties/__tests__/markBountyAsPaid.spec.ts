import type { Space, User } from '@charmverse/core/dist/prisma';

import { InvalidInputError } from 'lib/utilities/errors';
import {
  generateBountyApplication,
  generateBountyWithSingleApplication,
  generateSpaceUser,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';

import { markBountyAsPaid } from '../markBountyAsPaid';

let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  space = generated.space;
});

describe('markBountyAsPaid', () => {
  it('should update the bounty status to paid (keep rejected application status intact)', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'paid',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id,
      customReward: 'Custom NFT'
    });

    const member1 = await generateSpaceUser({ spaceId: space.id });
    const member2 = await generateSpaceUser({ spaceId: space.id });

    await generateBountyApplication({
      applicationStatus: 'complete',
      bountyId: bounty.id,
      spaceId: space.id,
      userId: member1.id
    });

    await generateBountyApplication({
      applicationStatus: 'rejected',
      bountyId: bounty.id,
      spaceId: space.id,
      userId: member2.id
    });

    const updatedBounty = await markBountyAsPaid(bounty.id);

    expect(updatedBounty.status).toBe('paid');
    expect(
      updatedBounty.applications.every(
        (application) => application.status === 'paid' || application.status === 'rejected'
      )
    ).toBeTruthy();
  });

  it('should fail if the atleast one bounty submission is in progress', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    await expect(() => markBountyAsPaid(bounty.id)).rejects.toThrow(
      new InvalidInputError('All applications need to be either completed or paid in order to mark bounty as paid')
    );
  });

  it('should fail if the atleast one bounty submission is in applied state', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'applied',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    await expect(() => markBountyAsPaid(bounty.id)).rejects.toThrow(
      new InvalidInputError('All applications need to be either completed or paid in order to mark bounty as paid')
    );
  });
});
