/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PageWithPermissions } from '@charmverse/core/pages';
import type { Space } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@packages/profile/getUser';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateBounty, generateSpaceUser, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import request from 'supertest';

let user: LoggedInUser;
let space: Space;
let cookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  user = generated.user;
  space = generated.space;
  cookie = await loginUser(user.id);
});

describe('POST /api/pages/{pageId}/restrict-permissions - Lock down bounty page permissions to the creator', () => {
  it('should allow a user with the edit_content permission to lock the bounty page permissions, returning the new Bounty page and responding with 200', async () => {
    const submitterUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: false,
      status: 'open',
      chainId: 1,
      rewardToken: 'ETH',
      bountyPermissions: {
        creator: [
          {
            group: 'user',
            id: user.id
          }
        ],
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      },
      pagePermissions: [
        {
          permissionLevel: 'editor',
          userId: user.id
        },
        {
          permissionLevel: 'view_comment',
          spaceId: space.id
        },
        {
          permissionLevel: 'editor',
          userId: submitterUser.id
        }
      ]
    });

    const { permissions } = (
      await request(baseUrl)
        .post(`/api/pages/${bounty.id}/restrict-permissions`)
        .set('Cookie', cookie)
        .send({})
        .expect(200)
    ).body as PageWithPermissions;

    expect(permissions.length > 0).toBe(true);
  });

  it('should allow an admin without the edit_content permission to lock the bounty page permissions, returning the new Bounty page and responding with 200', async () => {
    const adminUser = await generateSpaceUser({
      isAdmin: true,
      spaceId: space.id
    });

    const adminCookie = await loginUser(adminUser.id);

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: false,
      status: 'open',
      chainId: 1,
      rewardToken: 'ETH',
      bountyPermissions: {
        creator: [
          {
            group: 'user',
            id: user.id
          }
        ],
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      },
      pagePermissions: [
        {
          permissionLevel: 'editor',
          userId: user.id
        },
        {
          permissionLevel: 'view_comment',
          spaceId: space.id
        }
      ]
    });

    const { permissions } = (
      await request(baseUrl)
        .post(`/api/pages/${bounty.id}/restrict-permissions`)
        .set('Cookie', adminCookie)
        .send({})
        .expect(200)
    ).body as PageWithPermissions;

    expect(permissions.length).toBe(2);
    expect(permissions.some((p) => p.userId === user.id && p.permissionLevel === 'full_access'));
    expect(permissions.some((p) => p.spaceId === space.id && p.permissionLevel === 'view'));
  });

  it('should fail if the non-admin user does not have the lock permission and respond with 401', async () => {
    const extraNonAdminUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const nonAdminCookie = await loginUser(extraNonAdminUser.id);

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: false,
      status: 'open',
      chainId: 1,
      rewardToken: 'ETH',
      bountyPermissions: {
        creator: [
          {
            group: 'user',
            id: user.id
          }
        ],
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      },
      pagePermissions: [
        {
          permissionLevel: 'editor',
          userId: user.id
        },
        {
          permissionLevel: 'view_comment',
          spaceId: space.id
        }
      ]
    });

    await request(baseUrl)
      .post(`/api/pages/${bounty.id}/restrict-permissions`)
      .set('Cookie', nonAdminCookie)
      .send({})
      .expect(401);
  });
});
