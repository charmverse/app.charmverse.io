import type { MemberProperty, Space } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import request from 'supertest';

import type { PropertyValue } from 'lib/members/interfaces';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateMemberProperty, generateMemberPropertyValue } from 'testing/utils/members';

let space: Space;
let adminUser: LoggedInUser;
let nonAdminUser: LoggedInUser;
let adminCookie: string;
let nonAdminCookie: string;

let property1: MemberProperty;

beforeAll(async () => {
  const { user, space: generatedSpace } = await generateUserAndSpaceWithApiToken(undefined, true);
  space = generatedSpace;
  adminUser = user;
  nonAdminUser = await generateSpaceUser({ spaceId: generatedSpace.id, isAdmin: false });
  nonAdminCookie = await loginUser(nonAdminUser.id);
  adminCookie = await loginUser(adminUser.id);

  property1 = await generateMemberProperty({
    type: 'text',
    userId: adminUser.id,
    spaceId: space.id,
    name: 'test text'
  });
});

describe('POST /api/members/[memberId]/values/[spaceId] - Update / create member properties', () => {
  it('should create property value by admin user', async () => {
    const memberPropertyValues = (
      await request(baseUrl)
        .put(`/api/members/${nonAdminUser.id}/values/${space.id}`)
        .set('Cookie', adminCookie)
        .send([{ memberPropertyId: property1.id, value: 'updated text' }])
        .expect(200)
    ).body as PropertyValue[];

    expect(memberPropertyValues.length).toBe(1);
    expect(memberPropertyValues[0]).toEqual(
      expect.objectContaining({
        memberPropertyId: property1.id,
        type: property1.type,
        name: property1.name,
        value: 'updated text',
        spaceId: space.id
      })
    );
  });

  it('should create property value by non-admin user for himself', async () => {
    const memberPropertyValues = (
      await request(baseUrl)
        .put(`/api/members/${nonAdminUser.id}/values/${space.id}`)
        .set('Cookie', nonAdminCookie)
        .send([{ memberPropertyId: property1.id, value: 'updated text2' }])
        .expect(200)
    ).body as PropertyValue[];

    expect(memberPropertyValues.length).toBe(1);
    expect(memberPropertyValues[0]).toEqual(
      expect.objectContaining({
        memberPropertyId: property1.id,
        type: property1.type,
        name: property1.name,
        value: 'updated text2',
        spaceId: space.id
      })
    );
  });

  it('should update multiple property values by admin user', async () => {
    const property2 = await generateMemberProperty({
      type: 'number',
      userId: adminUser.id,
      spaceId: space.id,
      name: 'test number'
    });
    const property3 = await generateMemberProperty({
      type: 'text',
      userId: adminUser.id,
      spaceId: space.id,
      name: 'test text2'
    });
    await generateMemberPropertyValue({
      memberPropertyId: property2.id,
      userId: nonAdminUser.id,
      spaceId: space.id,
      value: 2
    });
    await generateMemberPropertyValue({
      memberPropertyId: property3.id,
      userId: nonAdminUser.id,
      spaceId: space.id,
      value: 'val1'
    });

    const memberPropertyValues = (
      await request(baseUrl)
        .put(`/api/members/${nonAdminUser.id}/values/${space.id}`)
        .set('Cookie', adminCookie)
        .send([
          { memberPropertyId: property2.id, value: 1337 },
          { memberPropertyId: property3.id, value: 'updated text2' }
        ])
        .expect(200)
    ).body as PropertyValue[];

    expect(memberPropertyValues.length).toBe(2);
    expect(memberPropertyValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          memberPropertyId: property2.id,
          type: property2.type,
          name: property2.name,
          value: 1337,
          spaceId: space.id
        }),
        expect.objectContaining({
          memberPropertyId: property3.id,
          type: property3.type,
          name: property3.name,
          value: 'updated text2',
          spaceId: space.id
        })
      ])
    );
  });

  it('should not allow non-admin user to update someone else property value', async () => {
    await request(baseUrl)
      .put(`/api/members/${adminUser.id}/values/${space.id}`)
      .set('Cookie', nonAdminCookie)
      .send([{ memberPropertyId: property1.id, value: 'updated text2' }])
      .expect(401);
  });
});
