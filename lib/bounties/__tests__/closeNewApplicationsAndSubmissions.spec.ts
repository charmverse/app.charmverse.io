import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { DataNotFoundError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateUserAndSpaceWithApiToken, generateBountyWithSingleApplication } from 'testing/setupDatabase';

import { lockApplicationAndSubmissions } from '../lockApplicationAndSubmissions';

let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  space = generated.space;

});

describe('lockApplicationAndSubmissions', () => {
  it('should lock submissions', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const updatedBounty = await lockApplicationAndSubmissions(bounty.id);

    expect(updatedBounty.submissionsLocked).toBe(true);
  });

  it('should fail if the bounty does not exist', async () => {

    try {
      await lockApplicationAndSubmissions(v4());
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });
});
