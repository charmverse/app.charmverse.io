import type { Space, User } from '@prisma/client';
import { BountyPermissionLevel } from '@prisma/client';
import { v4 } from 'uuid';

import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import { ExpectedAnError } from 'testing/errors';
import { generateBounty, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { addBountyPermissionGroup } from '../addBountyPermissionGroup';
import { removeBountyPermissionGroup } from '../removeBountyPermissionGroup';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  space = generated.space;
  user = generated.user;
});

describe('removeBountyPermissionGroup', () => {

  it('should delete the assigned mapping', async () => {

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

    const afterDelete = await removeBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: user.id
      },
      level: 'creator',
      resourceId: bounty.id
    });

    typedKeys(BountyPermissionLevel).forEach(level => {
      expect(afterDelete[level].length).toBe(0);
    });

  });

  it('should return the assigned mapping as it was before if there is nothing to delete', async () => {

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

    const afterDelete = await removeBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: user.id
      },
      level: 'creator',
      resourceId: bounty.id
    });

    const afterSecondDelete = await removeBountyPermissionGroup({
      assignee: {
        group: 'user',
        id: user.id
      },
      level: 'creator',
      resourceId: bounty.id
    });

    typedKeys(afterSecondDelete).forEach(key => {
      // Simple way of asserting both are the same
      expect(afterDelete[key].length).toBe(0);
      expect(afterSecondDelete[key].length).toBe(0);
    });

  });

  it('should fail if the bounty does not exist', async () => {
    try {
      await removeBountyPermissionGroup({
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

  it('should fail if an invalid permission level is provided', async () => {
    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    try {
      await removeBountyPermissionGroup({
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

  it('should fail if an invalid assignee group is provided', async () => {
    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    try {
      await removeBountyPermissionGroup({
        assignee: {
          group: 'userrr' as any,
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

  it('should fail if assignee is not public and an id for the assignee is not provided', async () => {
    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      maxSubmissions: 1
    });

    try {
      await removeBountyPermissionGroup({
        assignee: {
          group: 'user',
          id: undefined
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

});
