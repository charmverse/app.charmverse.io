import { Space, User } from '@prisma/client';
import { generateUserAndSpaceWithApiToken, generateBountyWithSingleApplication } from 'testing/setupDatabase';
import { closeNewApplicationsAndSubmissions } from '../closeNewApplicationsAndSubmissions';

let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  space = generated.space;

});

describe('closeNewApplicationsAndSubmissions', () => {
  it('should update the cap of the bounty to the current amount of active / accepted submissions', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const updatedBounty = await closeNewApplicationsAndSubmissions(bounty.id);

    expect(updatedBounty.maxSubmissions).toBe(1);
  });

  // See rollupBountyStatus for how this works
  it('should rollup the bounty status after the new submission cap', async () => {
    const bounty = await generateBountyWithSingleApplication({
      bountyStatus: 'open',
      applicationStatus: 'inProgress',
      bountyCap: 2,
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const updatedBounty = await closeNewApplicationsAndSubmissions(bounty.id);

    expect(updatedBounty.status).toBe('inProgress');
  });
});
