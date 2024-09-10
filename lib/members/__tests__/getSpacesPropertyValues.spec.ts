import type { MemberProperty, Space } from '@charmverse/core/prisma';
import { getSpacesPropertyValues } from '@root/lib/members/getSpacesPropertyValues';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { v4 } from 'uuid';

import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateMemberProperty } from 'testing/utils/members';
import { addUserToSpace, generateSpaceForUser } from 'testing/utils/spaces';

let user1: LoggedInUser;
let user2: LoggedInUser;
let user3: LoggedInUser;

let property1: MemberProperty;
let property2: MemberProperty;
let property3: MemberProperty;
let property4: MemberProperty;

let u1Space1: Space;
let u1Space2: Space;

beforeAll(async () => {
  // User with 2 spaces
  const { user: u1, space } = await generateUserAndSpaceWithApiToken(undefined, true);
  user1 = u1;
  u1Space1 = space;
  u1Space2 = await generateSpaceForUser({ user: user1 });

  // User with 2 spaces, 1 common with user 1
  const { user: u2 } = await generateUserAndSpaceWithApiToken(undefined, true);
  user2 = await addUserToSpace({ spaceId: u1Space1.id, userId: u2.id, isAdmin: false });
  await generateSpaceForUser({ user: user2 });

  // User with no common spaces
  const { user: u3 } = await generateUserAndSpaceWithApiToken(undefined, true);
  user3 = u3;

  // Properties for user 1 spaces
  property1 = await generateMemberProperty({ type: 'text', userId: u1.id, spaceId: u1Space1.id, name: 'test text1' });
  property2 = await generateMemberProperty({ type: 'text', userId: u1.id, spaceId: u1Space1.id, name: 'test text2' });
  property3 = await generateMemberProperty({ type: 'text', userId: u1.id, spaceId: u1Space2.id, name: 'test text3' });
  property4 = await generateMemberProperty({ type: 'text', userId: u1.id, spaceId: u1Space2.id, name: 'test text4' });
});

describe('getSpacesPropertyValues', () => {
  it('Should return properties with values for all user spaces', async () => {
    const result = await getSpacesPropertyValues({ memberId: user1.id, requestingUserId: user1.id });

    expect(result.length).toEqual(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          spaceId: u1Space1.id,
          properties: expect.arrayContaining([
            expect.objectContaining({ memberPropertyId: property1.id }),
            expect.objectContaining({ memberPropertyId: property2.id })
          ])
        }),
        expect.objectContaining({
          spaceId: u1Space2.id,
          properties: expect.arrayContaining([
            expect.objectContaining({ memberPropertyId: property3.id }),
            expect.objectContaining({ memberPropertyId: property4.id })
          ])
        })
      ])
    );
  });

  it('Should return properties with values for spaces common wiht other user', async () => {
    const result = await getSpacesPropertyValues({ memberId: user1.id, requestingUserId: user2.id });

    expect(result.length).toEqual(1);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          spaceId: u1Space1.id,
          properties: expect.arrayContaining([
            expect.objectContaining({ memberPropertyId: property1.id }),
            expect.objectContaining({ memberPropertyId: property2.id })
          ])
        })
      ])
    );
  });

  it('Should return empty array for user with no common spaces', async () => {
    const result = await getSpacesPropertyValues({ memberId: user1.id, requestingUserId: user3.id });

    expect(result.length).toEqual(0);
  });

  it('Should return properties only for space specified in param', async () => {
    const result = await getSpacesPropertyValues({
      memberId: user1.id,
      requestingUserId: user1.id,
      spaceId: u1Space1.id
    });

    expect(result.length).toEqual(1);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          spaceId: u1Space1.id,
          properties: expect.arrayContaining([
            expect.objectContaining({ memberPropertyId: property1.id }),
            expect.objectContaining({ memberPropertyId: property2.id })
          ])
        })
      ])
    );
  });

  it('Should return empty array for space that user does not belong to', async () => {
    const result = await getSpacesPropertyValues({ memberId: user1.id, requestingUserId: user1.id, spaceId: v4() });

    expect(result.length).toEqual(0);
  });
});
