import type { MemberProperty, Space } from '@prisma/client';
import request from 'supertest';

import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateMemberProperty } from 'testing/utils/members';

let space: Space;
let adminUser: LoggedInUser;
let nonAdminUser: LoggedInUser;
let adminCookie: string;
let nonAdminCookie: string;

beforeAll(async () => {
  const { user, space: generatedSpace } = await generateUserAndSpaceWithApiToken(undefined, true);
  space = generatedSpace;
  adminUser = user;
  nonAdminUser = await generateSpaceUser({ spaceId: generatedSpace.id, isAdmin: false });
  nonAdminCookie = await loginUser(nonAdminUser.id);
  adminCookie = await loginUser(adminUser.id);
});

describe('GET /api/space/[id]/members/properties - Get member properties', () => {
  let property1: MemberProperty;
  let property2: MemberProperty;

  beforeAll(async () => {
    property1 = await generateMemberProperty({ type: 'text', userId: adminUser.id, spaceId: space.id, name: 'test text' });
    property2 = await generateMemberProperty({ type: 'number', userId: adminUser.id, spaceId: space.id, name: 'test number' });
  });

  it('should return member properties for admin user', async () => {
    const memberProperties = (await request(baseUrl)
      .get(`/api/spaces/${space.id}/members/properties`)
      .set('Cookie', adminCookie)
      .expect(200)).body as MemberProperty[];

    expect(memberProperties.length).toBe(2);
    expect(memberProperties).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: property1.id }),
      expect.objectContaining({ id: property2.id })
    ]));
  });

  it('should return member properties for non-admin user', async () => {
    // TODO - test returning only permitted props when will be ready
    const memberProperties = (await request(baseUrl)
      .get(`/api/spaces/${space.id}/members/properties`)
      .set('Cookie', nonAdminCookie)
      .expect(200)).body as MemberProperty[];

    expect(memberProperties.length).toBe(2);
    expect(memberProperties).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: property1.id }),
      expect.objectContaining({ id: property2.id })
    ]));
  });

  it('should return error for user from other space', async () => {
    const { user: otherSpaceUser } = await generateUserAndSpaceWithApiToken(undefined, true);
    const otherSpaceUserCookie = await loginUser(otherSpaceUser.id);

    (await request(baseUrl)
      .get(`/api/spaces/${space.id}/members/properties`)
      .set('Cookie', otherSpaceUserCookie)
      .expect(401));
  });
});
