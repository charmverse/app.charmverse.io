import type { BountyPermission, Space, User } from '@prisma/client';
import { BountyPermissionLevel } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { DataNotFoundError, InsecureOperationError, InvalidInputError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import { ExpectedAnError } from 'testing/errors';
import { generateBounty, generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { addBountyPermissionGroup } from '../addBountyPermissionGroup';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
  space = generated.space;
});

describe('addBountyPermissionGroup', () => {

  it('should return the current mapping of permissions for a bounty', async () => {

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    const newPermissionSet = await addBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: user.id
      },
      level: 'creator',
      resourceId: bounty.id
    });

    typedKeys(BountyPermissionLevel).forEach(level => {
      expect(newPermissionSet[level]).toBeInstanceOf(Array);

      if (level !== 'creator') {
        expect(newPermissionSet[level].length).toBe(0);
      }
      else {
        expect(newPermissionSet[level].length).toBe(1);
      }

    });

  });

  it('should not create a duplicate permission for the same combination of permission level and assignee', async () => {

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    await addBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: user.id
      },
      level: 'creator',
      resourceId: bounty.id
    });

    await addBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: user.id
      },
      level: 'creator',
      resourceId: bounty.id
    });

    const updatedBounty = await prisma.bounty.findUnique({
      where: {
        id: bounty.id
      },
      select: {
        permissions: true
      }
    }) as { permissions: BountyPermission[] };

    expect(updatedBounty.permissions.length).toBe(1);

  });

  it('should fail if assigning to a space outside the space the bounty belongs to', async () => {

    const { space: extraSpace } = await generateUserAndSpaceWithApiToken(undefined, false);

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    try {
      await addBountyPermissionGroup({
        assignee: {
          group: 'space',
          id: extraSpace.id
        },
        level: 'reviewer',
        resourceId: bounty.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }

  });

  it('should fail if assigning to a role outside the space the bounty belongs to', async () => {

    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const externalRole = await generateRole({
      createdBy: extraUser.id,
      spaceId: extraSpace.id
    });

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    try {
      await addBountyPermissionGroup({
        assignee: {
          group: 'role',
          id: externalRole.id
        },
        level: 'reviewer',
        resourceId: bounty.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }

  });

  it('should fail if assigning to a user who is not a member of the space the bounty belongs to', async () => {
    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    try {
      await addBountyPermissionGroup({
        assignee: {
          group: 'user',
          id: extraUser.id
        },
        level: 'reviewer',
        resourceId: bounty.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }
  });

  it('should fail if an invalid assignee group is provided', async () => {

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    try {
      await addBountyPermissionGroup({
        assignee: {
          group: 'invalid' as any,
          id: user.id
        },
        level: 'creator',
        resourceId: bounty.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }

  });

  it('should fail if an empty assignee id is provided for groups other than public', async () => {

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    try {
      await addBountyPermissionGroup({
        assignee: {
          group: 'user',
          id: undefined as any
        },
        level: 'creator',
        resourceId: bounty.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }

  });

  it('should fail if an invalid permission level is provided', async () => {

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    try {
      await addBountyPermissionGroup({
        assignee: {
          group: 'user',
          id: user.id
        },
        level: 'creatorrr' as any,
        resourceId: bounty.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }

  });

  it('should fail if any other level than viewer is assigned to the public', async () => {

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    try {
      await addBountyPermissionGroup({
        assignee: {
          group: 'public',
          id: undefined
        },
        // Too high permission level for reviewers
        level: 'reviewer',
        resourceId: bounty.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }

  });

  it('should fail if the bounty does not exist', async () => {
    try {
      await addBountyPermissionGroup({
        assignee: {
          group: 'user',
          id: user.id
        },
        level: 'creator',
        resourceId: v4()
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

});
