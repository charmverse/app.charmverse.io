import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import request from 'supertest';
import { v4 } from 'uuid';

import type { UpdateableSpaceFields } from 'lib/spaces/updateSpace';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

let space: Space;
let memberUser: LoggedInUser;

let adminCookie: string;
let memberCookie: string;

beforeAll(async () => {
  const { space: generatedSpace, user: adminUser } = await generateUserAndSpace({ isAdmin: true });
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

describe('DELETE /api/spaces - Delete space', () => {
  it('Should allow an admin to delete a space, responding 200', async () => {
    const data = await generateUserAndSpace({ isAdmin: true });
    const sessionCookie = await loginUser(data.user.id);
    await request(baseUrl).delete(`/api/spaces/${data.space.id}`).set('Cookie', sessionCookie).expect(200);
    const dbSpace = await prisma.space.findUnique({ where: { id: data.space.id } });
    expect(dbSpace).toBeNull();
  });

  it('Should fail if user is not an admin and respond with 401', async () => {
    const data = await generateUserAndSpace();
    const sessionCookie = await loginUser(data.user.id);
    await request(baseUrl).put(`/api/spaces/${data.space.id}`).set('Cookie', sessionCookie).expect(401);
    const dbSpace = await prisma.space.findUnique({ where: { id: data.space.id } });
    expect(dbSpace).not.toBeNull();
  });
});
