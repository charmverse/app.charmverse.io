
import { v4 } from 'uuid';

import { DataNotFoundError } from 'lib/utilities/errors';
import { generateBounty, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { addBountyPermissionGroup } from '../addBountyPermissionGroup';
import { queryBountyPermissions } from '../queryBountyPermissions';

describe('queryBountyPermissions', () => {

  it('should return a mapping of all assigned groups', async () => {

    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    await Promise.all([
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'reviewer',
        assignee: {
          group: 'user',
          id: user.id
        }
      }),
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'submitter',
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    ]);

    const queryResult = await queryBountyPermissions({
      bountyId: bounty.id
    });

    expect(queryResult.submitter.length).toBe(1);
    expect(queryResult.submitter[0].id).toBe(space.id);
    expect(queryResult.reviewer.length).toBe(1);
    expect(queryResult.reviewer[0].id).toBe(user.id);
    // Creator gets a synthetic permission injected
    expect(queryResult.creator.length).toBe(1);

  });

  it('should assign a creator permission to creator in query results, even if this is not in the database', async () => {

    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    const queryResult = await queryBountyPermissions({
      bountyId: bounty.id
    });

    expect(queryResult.creator.length).toBe(1);

    const syntheticPermission = queryResult.creator[0];

    expect(syntheticPermission.group === 'user' && syntheticPermission.id === user.id).toBe(true);

  });

  it('should fail if the bounty does not exist', async () => {

    await expect(queryBountyPermissions({
      bountyId: v4()
    })).rejects.toBeInstanceOf(DataNotFoundError);

  });

});
