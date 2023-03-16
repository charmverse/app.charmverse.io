import type { Space, User } from '@prisma/client';
import request from 'supertest';

import type { Member } from 'lib/members/interfaces';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

let space: Space;
let adminUser: User;
let nonAdminUser: User;
let adminCookie: string;
let nonAdminCookie: string;

beforeAll(async () => {
  const { user, space: generatedSpace } = await generateUserAndSpace({ isAdmin: true });
  space = generatedSpace;
  adminUser = user;
  nonAdminUser = await generateSpaceUser({ spaceId: generatedSpace.id, isAdmin: false });
  nonAdminCookie = await loginUser(nonAdminUser.id);
  adminCookie = await loginUser(adminUser.id);
});

describe('GET /api/space/[id]/members - Get list of members in a space', () => {
  it('should return users with member properties for space members', async () => {
    const members = (
      await request(baseUrl).get(`/api/spaces/${space.id}/members`).set('Cookie', nonAdminCookie).expect(200)
    ).body as Member[];
    expect(members.length).toBe(2);

    expect(members).toEqual(
      expect.arrayContaining([
        expect.objectContaining<Partial<Member>>({
          // Didnt add all the fields here
          id: adminUser.id,
          username: adminUser.username,
          // Extra props added by the endpoint on top of normal user
          onboarded: expect.any(Boolean),
          isAdmin: expect.any(Boolean),
          joinDate: expect.any(String),
          hasNftAvatar: expect.any(Boolean),
          properties: [],
          roles: []
        }),
        expect.objectContaining<Partial<Member>>({
          // Didnt add all the fields here
          id: nonAdminUser.id,
          username: nonAdminUser.username,
          // Extra props added by the endpoint on top of normal user
          onboarded: expect.any(Boolean),
          isAdmin: expect.any(Boolean),
          joinDate: expect.any(String),
          hasNftAvatar: expect.any(Boolean),
          properties: [],
          roles: []
        })
        //        expect.objectContaining({ id: nonAdminUser.id })
      ])
    );
  });

  it('should return simplified users for non-space members', async () => {
    const members = (await request(baseUrl).get(`/api/spaces/${space.id}/members`).expect(200)).body as Member[];
    expect(members.length).toBe(2);

    members.forEach((m) => {
      expect(typeof m.username === 'string' && m.username.length > 0).toBe(true);
    });

    expect(members).toEqual(
      // Make sure we only get simplified data, and that the username has been anonymised
      expect.arrayContaining<Partial<Member>>([
        expect.objectContaining({
          id: adminUser.id,
          username: expect.not.stringContaining(adminUser.username)
        }),
        expect.objectContaining({
          id: nonAdminUser.id,
          username: expect.not.stringContaining(nonAdminUser.username)
        })
      ])
    );
  });

  // it('should return member properties for non-admin user', async () => {
  //   // TODO - test returning only permitted props when will be ready
  //   const memberProperties = (
  //     await request(baseUrl).get(`/api/spaces/${space.id}/members/properties`).set('Cookie', nonAdminCookie).expect(200)
  //   ).body as MemberProperty[];

  //   expect(memberProperties.length).toBe(2);
  //   expect(memberProperties).toEqual(
  //     expect.arrayContaining([
  //       expect.objectContaining({ id: property1.id }),
  //       expect.objectContaining({ id: property2.id })
  //     ])
  //   );
});
