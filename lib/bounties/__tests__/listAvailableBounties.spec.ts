
import { Space, User } from '@prisma/client';
import { generateUserAndSpaceWithApiToken, generateBountyWithSingleApplication, generateBounty, generateSpaceUser, generateRole } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { ExpectedAnError } from 'testing/errors';
import { countValidSubmissions } from 'lib/applications/shared';
import { DataNotFoundError, WrongStateError } from 'lib/utilities/errors';
import { assignRole } from 'lib/roles';
import { createApplication, createSubmission } from '../../applications/actions';
import { closeOutBounty } from '../closeOutBounty';
import { createBounty } from '../createBounty';
import { reviewBountySuggestion } from '../reviewBountySuggestion';
import { listAvailableBounties } from '../listAvailableBounties';
import { addBountyPermissionGroup } from '../../permissions/bounties';

let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  space = generated.space;

});

describe('listAvailableBounties', () => {
  it('should only return the bounties the user has access to', async () => {

    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const [bountyByUser, bountyByOtherUser, bountyByRole, bountyBySpace, bountyByPublic] = await Promise.all([
      createBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty by user'
      }),
      createBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty by other user'
      }),
      createBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty by role'
      }),
      createBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty by space'
      }),
      createBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty by space'
      })
    ]);

    // Permission the user
    await addBountyPermissionGroup({
      level: 'viewer',
      resourceId: bountyByUser.id,
      assignee: {
        group: 'user',
        id: extraUser.id
      }
    });

    // Permission the role
    const role = await generateRole({
      spaceId: space.id,
      createdBy: nonAdminUser.id
    });

    await assignRole({
      roleId: role.id,
      userId: extraUser.id
    });

    await addBountyPermissionGroup({
      level: 'viewer',
      resourceId: bountyByRole.id,
      assignee: {
        group: 'role',
        id: role.id
      }
    });

    // Permission the space
    await addBountyPermissionGroup({
      level: 'viewer',
      resourceId: bountyBySpace.id,
      assignee: {
        group: 'space',
        id: space.id
      }
    });

    // Permission the public
    await addBountyPermissionGroup({
      level: 'viewer',
      resourceId: bountyByPublic.id,
      assignee: {
        group: 'public',
        id: undefined
      }
    });

    const available = await listAvailableBounties({
      spaceId: space.id,
      userId: extraUser.id
    });

    expect(available.length).toBe(4);
  });

});
