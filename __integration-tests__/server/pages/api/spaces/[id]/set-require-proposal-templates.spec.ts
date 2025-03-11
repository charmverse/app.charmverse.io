/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@charmverse/core/prisma';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateSpaceUser } from '@packages/testing/setupDatabase';
import request from 'supertest';

import type { SpacePublicProposalToggle } from 'lib/spaces/toggleSpacePublicProposals';

let nonAdminUser: User;
let nonAdminUserCookie: string;
let adminUser: User;
let adminUserCookie: string;
let space: Space;

beforeAll(async () => {
  const { space: generatedSpace, user } = await testUtilsUser.generateUserAndSpace({
    isAdmin: false,
    publicProposals: false
  });

  space = generatedSpace;
  nonAdminUser = user;
  adminUser = await generateSpaceUser({
    isAdmin: true,
    spaceId: space.id
  });

  nonAdminUserCookie = await loginUser(nonAdminUser.id);
  adminUserCookie = await loginUser(adminUser.id);
});

describe('POST /api/spaces/[id]/set-public-proposals - Make the space proposals public or private', () => {
  it('should update a space`s public proposal status, if user is the admin and return the space, responding with 200', async () => {
    const update: Pick<SpacePublicProposalToggle, 'publicProposals'> = {
      publicProposals: true
    };

    const updatedSpace = (
      await request(baseUrl)
        .post(`/api/spaces/${space.id}/set-public-proposals`)
        .set('Cookie', adminUserCookie)
        .send(update)
        .expect(200)
    ).body as Space;

    expect(updatedSpace.publicProposals).toBe(true);
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-public-proposals`)
      .set('Cookie', nonAdminUserCookie)
      .send({
        publicProposals: true
      })
      .expect(401);
  });

  it('should fail if the space is not a  admin of the space, and respond 401', async () => {
    await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-public-proposals`)
      .set('Cookie', nonAdminUserCookie)
      .send({
        publicProposals: true
      })
      .expect(401);
  });
});
