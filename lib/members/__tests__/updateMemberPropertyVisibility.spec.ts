import type { MemberProperty, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { UndesirableOperationError } from '@root/lib/utils/errors';

import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateMemberProperty } from 'testing/utils/members';
import { addUserToSpace, generateSpaceForUser } from 'testing/utils/spaces';

import { updateMemberPropertyVisibility } from '../updateMemberPropertyVisibility';

let user2: LoggedInUser;

let property1: MemberProperty;
let property2: MemberProperty;
let property3: MemberProperty;

let u1Space1: Space;

beforeAll(async () => {
  // User with 2 spaces
  const { user: u1, space } = await generateUserAndSpaceWithApiToken(undefined, true);
  u1Space1 = space;

  // User with 2 spaces, 1 common with user 1
  const { user: u2 } = await generateUserAndSpaceWithApiToken(undefined, true);
  user2 = await addUserToSpace({ spaceId: u1Space1.id, userId: u2.id, isAdmin: false });
  await generateSpaceForUser({ user: user2 });

  // Create name property manually as generateMemberProperty don't allow creating default properties
  property1 = await prisma.memberProperty.create({
    data: {
      name: 'Avatar',
      type: 'profile_pic',
      space: { connect: { id: u1Space1.id } },
      createdBy: u1.id,
      updatedBy: u1.id
    }
  });
  property2 = await generateMemberProperty({ type: 'email', userId: u1.id, spaceId: u1Space1.id, name: 'test text1' });
  property3 = await generateMemberProperty({ type: 'phone', userId: u1.id, spaceId: u1Space1.id, name: 'test text1' });
});

describe('updateMemberPropertyVisibility', () => {
  it('Should throw undesirable state error if unhideable property is updated ', async () => {
    await expect(
      updateMemberPropertyVisibility({ memberPropertyId: property1.id, view: 'gallery', visible: false })
    ).rejects.toBeInstanceOf(UndesirableOperationError);
  });

  it('Should remove table view from enabledViews if visible is false ', async () => {
    const memberProperty = await updateMemberPropertyVisibility({
      memberPropertyId: property2.id,
      view: 'table',
      visible: false
    });

    expect(memberProperty).toEqual(
      expect.objectContaining({
        enabledViews: expect.arrayContaining(['gallery', 'profile'])
      })
    );
  });

  it('Should add gallery view to enabledViews if visible is true ', async () => {
    await updateMemberPropertyVisibility({ memberPropertyId: property3.id, view: 'gallery', visible: false });
    const memberProperty = await updateMemberPropertyVisibility({
      memberPropertyId: property3.id,
      view: 'gallery',
      visible: true
    });

    expect(memberProperty).toEqual(
      expect.objectContaining({
        enabledViews: expect.arrayContaining(['table', 'gallery', 'profile'])
      })
    );
  });
});
