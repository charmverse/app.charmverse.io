import { Space, User } from '@prisma/client';
import { generateUserAndSpaceWithApiToken, generateBountyWithSingleApplication } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { ExpectedAnError } from 'testing/errors';
import { DataNotFoundError } from 'lib/utilities/errors';
import { closeNewApplicationsAndSubmissions } from '../closeNewApplicationsAndSubmissions';

let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  space = generated.space;

});

describe('closeNewApplicationsAndSubmissions', () => {
  it('should lock submissions', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const updatedBounty = await closeNewApplicationsAndSubmissions(bounty.id);

    expect(updatedBounty.submissionsLocked).toBe(true);
  });

  it('should fail if the bounty does not exist', async () => {

    try {
      await closeNewApplicationsAndSubmissions(v4());
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });
});
