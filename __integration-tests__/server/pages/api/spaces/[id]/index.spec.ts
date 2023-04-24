import type { Space } from '@charmverse/core/dist/prisma';
import request from 'supertest';
import { v4 } from 'uuid';

import type { UpdateableSpaceFields } from 'lib/spaces/updateSpace';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let space: Space;
let adminUser: LoggedInUser;
let memberUser: LoggedInUser;

let adminCookie: string;
let memberCookie: string;

beforeAll(async () => {
  const { space: generatedSpace, user: generatedUser } = await generateUserAndSpaceWithApiToken(undefined, true);
  adminUser = generatedUser;
  memberUser = await generateSpaceUser({ isAdmin: false, spaceId: generatedSpace.id });
  space = generatedSpace;
  adminCookie = await loginUser(adminUser.id);
  memberCookie = await loginUser(memberUser.id);
});

describe('PUT /api/spaces - Update space profile', () => {
  it('Should allow an admin to update the space, responding 200', async () => {
    const update: UpdateableSpaceFields = {
      domain: `new-space-domain-${v4()}`,
      name: 'New Space Name - Admin updated this',
      spaceImage: `https://new-space-logo-${v4()}.png`
    };
    const spaceAfterUpdate = await (
      await request(baseUrl).put(`/api/spaces/${space.id}`).set('Cookie', adminCookie).send(update).expect(200)
    ).body;

    expect(spaceAfterUpdate).toMatchObject(update);
  });

  it('Should work even if unexpected data is sent along with the payload, responding 200', async () => {
    const allowedProps: UpdateableSpaceFields = {
      domain: `new-space-domain-${v4()}`,
      name: 'New Space Name - Admin updated this',
      spaceImage: `https://new-space-logo-${v4()}.png`
    };

    const update = {
      ...allowedProps,
      randomField1: 234484848,
      objectField: {
        arrayOfData: [1, 2, 3, 4, 5]
      },
      stringContent: 'random string'
    };

    const spaceAfterUpdate = await (
      await request(baseUrl).put(`/api/spaces/${space.id}`).set('Cookie', adminCookie).send(update).expect(200)
    ).body;

    expect(spaceAfterUpdate).toMatchObject(allowedProps);
  });

  it('Should fail if user is not a part of the space and respond with 401', async () => {
    const update: UpdateableSpaceFields = {
      domain: `different-space-domain-${v4()}`,
      name: 'Ignored Space Name - Admin updated this',
      spaceImage: `https://new-space-logo-${v4()}.png`
    };
    await request(baseUrl).put(`/api/spaces/${space.id}`).set('Cookie', memberCookie).send(update).expect(401);
  });
});
