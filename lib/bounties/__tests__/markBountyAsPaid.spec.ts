import type { Space, User } from '@prisma/client';

import { InvalidInputError } from 'lib/utilities/errors';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { markBountyAsPaid } from '../markBountyAsPaid';

let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  space = generated.space;
});

describe('markBountyAsPaid', () => {
  it('should update the bounty status to paid', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id,
      customReward: 'Custom NFT'
    });

    const updatedBounty = await markBountyAsPaid(bounty.id);

    expect(updatedBounty.status).toBe('paid');
  });

  it("should fail if the bounty doesn't have custom reward", async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    await expect(() => markBountyAsPaid(bounty.id)).rejects.toThrow(
      new InvalidInputError('Only bounties with custom rewards can be marked as paid manually')
    );
  });
});
