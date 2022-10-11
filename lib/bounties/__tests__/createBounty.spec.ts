
import type { Bounty, Role, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { InvalidInputError } from 'lib/utilities/errors/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { queryBountyPermissions } from '../../permissions/bounties';
import { PositiveNumbersOnlyError } from '../../utilities/errors/numbers';
import { createBounty } from '../createBounty';
import type { BountyCreationData } from '../interfaces';

let user: User;
let space: Space;
let role: Role;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
  role = await generateRole({
    createdBy: user.id,
    spaceId: space.id
  });
});

describe('createBounty', () => {

  it('should be able to create a bounty suggestion with only a title, createdBy, spaceId and status, and record who suggested the bounty', async () => {

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id
    });

    expect(bounty).toEqual(
      expect.objectContaining<Partial<Bounty>>({
        createdBy: expect.stringContaining(user.id),
        spaceId: expect.stringContaining(space.id),
        suggestedBy: expect.stringContaining(user.id)
      })
    );

  });

  it('should accept as creation input: title, spaceId, createdBy, status, chainId, description, descriptionNodes, approveSubmitters, maxSubmissions, rewardAmount, rewardToken, reviewer, permissions', async () => {

    const fullBountyCreationData: BountyCreationData = {
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      chainId: 1,
      maxSubmissions: 100,
      rewardAmount: 1000,
      rewardToken: 'ETH',
      status: 'open',
      permissions: {
        submitter: [{ group: 'space', id: space.id }]
      }
    };

    const bounty = await createBounty(fullBountyCreationData);

    expect({
      chainId: fullBountyCreationData.chainId,
      maxSubmissions: fullBountyCreationData.maxSubmissions,
      rewardAmount: fullBountyCreationData.rewardAmount,
      rewardToken: fullBountyCreationData.rewardToken,
      status: fullBountyCreationData.status
    }).toStrictEqual({
      chainId: bounty.chainId,
      maxSubmissions: bounty.maxSubmissions,
      rewardAmount: bounty.rewardAmount,
      rewardToken: bounty.rewardToken,
      status: bounty.status
    });

    const bountyPermissions = await queryBountyPermissions({ bountyId: bounty.id });

    // Make sure permission was inserted correctly
    expect(bountyPermissions.submitter.some(p => p.group === 'space' && p.id === space.id)).toBe(true);

    // Make sure synthetic permission is applied
    expect(bountyPermissions.creator.some(p => p.group === 'user' && user.id === bounty.createdBy)).toBe(true);
    const { reviewer } = bountyPermissions;

    // Make sure nothing unexpected was added
    expect(reviewer.length).toBe(0);

  });

  it('should be able to create a bounty with a page in open status if the data provided has at least title, createdBy, spaceId, status and rewardAmount', async () => {

    const { user: adminUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    const bounty = await createBounty({
      createdBy: adminUser.id,
      spaceId: localSpace.id,
      status: 'open',
      rewardAmount: 1
    });

    expect(bounty).toEqual(
      expect.objectContaining<Partial<Bounty>>({
        createdBy: expect.stringContaining(adminUser.id),
        spaceId: expect.stringContaining(localSpace.id)
      })
    );

    expect(bounty.page).toMatchObject(expect.objectContaining({
      title: ''
    }));

  });

  it('should create a linked page with the same ID as the bounty', async () => {
    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1
    });

    expect(bounty.page.id).toBe(bounty.id);
  });

  it('should fail to create an open bounty if the reward amount is 0 and status is open', async () => {

    const { user: localUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    try {

      await createBounty({
        createdBy: localUser.id,
        spaceId: localSpace.id,
        rewardAmount: 0,
        status: 'open'
      });

      throw new ExpectedAnError();

    }
    catch (error) {
      expect(error).toBeInstanceOf(InvalidInputError);
    }

  });

  it('should fail to create a bounty if the reward amount is negative', async () => {

    const { user: localUser, space: localSpace } = await generateUserAndSpaceWithApiToken(undefined, true);

    try {

      await createBounty({
        createdBy: localUser.id,
        spaceId: localSpace.id,
        rewardAmount: -10,
        status: 'open'
      });

      throw new ExpectedAnError();

    }
    catch (error) {
      expect(error).toBeInstanceOf(PositiveNumbersOnlyError);
    }

  });

});

describe('createBounty / permissions setup', () => {

  it('should always create a page/full_access permissions for the creator', async () => {
    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id
    });

    const creatorFullAccessPermission = bounty.page.permissions.some(p => p.userId === user.id && p.permissionLevel === 'full_access');

    expect(creatorFullAccessPermission).toBe(true);

  });

  // Suggestion status
  it('should create a page/view permission for the space when creating a suggestion', async () => {
    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'suggestion'
    });

    const spaceViewPermission = bounty.page.permissions.some(p => p.spaceId === space.id && p.permissionLevel === 'view');

    expect(spaceViewPermission).toBe(true);
  });

  // Open status
  it('should create a page/view_comment permission for each role assigned as a reviewer', async () => {
    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      rewardToken: 'ETH',
      permissions: {
        reviewer: [{
          group: 'role',
          id: role.id
        }]
      }
    });

    const roleViewCommentPermission = bounty.page.permissions.some(p => p.roleId === role.id && p.permissionLevel === 'view_comment');

    expect(roleViewCommentPermission).toBe(true);
  });

  it('should create a page/view_comment permission for each user assigned as a reviewer', async () => {

    const extraUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      rewardToken: 'ETH',
      permissions: {
        reviewer: [{
          group: 'user',
          id: extraUser.id
        }]
      }
    });

    const userViewCommentPermission = bounty.page.permissions.some(p => p.userId === extraUser.id && p.permissionLevel === 'view_comment');

    expect(userViewCommentPermission).toBe(true);
  });

  it('should create a page/view permission for the space if the bounty can be worked on by the whole space', async () => {
    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      rewardToken: 'ETH',
      permissions: {
        submitter: [{
          group: 'space',
          id: space.id
        }]
      }
    });

    const spaceViewPermission = bounty.page.permissions.some(p => p.spaceId === space.id && p.permissionLevel === 'view');

    expect(spaceViewPermission).toBe(true);
  });

  it('should create a page/view permission for the roles if the bounty can only be worked on by specific roles', async () => {
    const bounty = await createBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      rewardToken: 'ETH',
      permissions: {
        submitter: [{
          group: 'role',
          id: role.id
        }]
      }
    });

    const roleViewPermission = bounty.page.permissions.some(p => p.roleId === role.id && p.permissionLevel === 'view');

    expect(roleViewPermission).toBe(true);
  });

  // Implicit relation: When creating the bounty page, we infer starting page permissions from who can submit
  it('should add a public page permission if the bounty is accessible to the space and public bounty board is enabled, ', async () => {
    const { space: publicBountySpace, user: _user } = await generateUserAndSpaceWithApiToken();

    await prisma.space.update({
      where: {
        id: publicBountySpace.id
      },
      data: {
        publicBountyBoard: true
      }
    });

    const bounty = await createBounty({
      createdBy: _user.id,
      spaceId: publicBountySpace.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      rewardToken: 'ETH',
      permissions: {
        submitter: [{
          group: 'space',
          id: publicBountySpace.id
        }]
      }
    });

    expect(bounty.page.permissions.some(p => p.public)).toBe(true);

  });

  it('should not add public page permission if the bounty is accessible to the space and public bounty board is disabled, ', async () => {
    const { space: publicBountySpace, user: _user } = await generateUserAndSpaceWithApiToken();

    await prisma.space.update({
      where: {
        id: publicBountySpace.id
      },
      data: {
        publicBountyBoard: false
      }
    });

    const bounty = await createBounty({
      createdBy: _user.id,
      spaceId: publicBountySpace.id,
      status: 'open',
      rewardAmount: 1,
      chainId: 1,
      rewardToken: 'ETH',
      permissions: {
        submitter: [{
          group: 'space',
          id: publicBountySpace.id
        }]
      }
    });

    expect(bounty.page.permissions.some(p => p.public)).toBe(false);

  });
});
