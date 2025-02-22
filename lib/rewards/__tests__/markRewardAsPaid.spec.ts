import type { Space, User } from '@charmverse/core/prisma';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBountyApplication, generateBountyWithSingleApplication } from '@packages/testing/setupDatabase';
import { InvalidInputError } from '@packages/utils/errors';

import { markRewardAsPaid } from '../markRewardAsPaid';

let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();

  nonAdminUser = generated.user;
  space = generated.space;
});

describe('markRewardAsPaid', () => {
  it('should update the reward status to paid (keep rejected application status intact)', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'paid',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id,
      customReward: 'Custom NFT'
    });

    const member1 = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    const member2 = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

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

    const updatedBounty = await markRewardAsPaid(bounty.id);

    expect(updatedBounty.status).toBe('paid');
    expect(
      updatedBounty.applications.every(
        (application) => application.status === 'paid' || application.status === 'rejected'
      )
    ).toBeTruthy();
  });

  it('should fail if the atleast one reward submission is in progress', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    await expect(() => markRewardAsPaid(bounty.id)).rejects.toThrow(
      new InvalidInputError('All applications need to be either completed or paid in order to mark reward as paid')
    );
  });

  it('should fail if the atleast one reward submission is in applied state', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'applied',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    await expect(() => markRewardAsPaid(bounty.id)).rejects.toThrow(
      new InvalidInputError('All applications need to be either completed or paid in order to mark reward as paid')
    );
  });
});
