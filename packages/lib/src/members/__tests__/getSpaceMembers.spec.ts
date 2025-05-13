import { prisma } from '@charmverse/core/prisma-client';
import { createUserWithWallet } from '@packages/testing/setupDatabase';
import { addUserToSpace, generateSpaceForUser } from '@packages/testing/utils/spaces';
import { randomETHWalletAddress } from '@packages/utils/blockchain';
import { v4 } from 'uuid';

import { createMemberProperty } from '../createMemberProperty';
import { getSpaceMembers } from '../getSpaceMembers';

describe('getSpaceMembers', () => {
  it(`Should get space members based on custom member property value`, async () => {
    const user1 = await createUserWithWallet({
      address: randomETHWalletAddress()
    });
    const user2 = await createUserWithWallet({
      address: randomETHWalletAddress()
    });
    const space = await generateSpaceForUser({ user: user1 });
    await addUserToSpace({ spaceId: space.id, userId: user2.id, isAdmin: false });

    const textMemberProperty = await createMemberProperty({
      data: {
        createdBy: user1.id,
        name: 'Text',
        type: 'text',
        updatedBy: user1.id,
        space: {
          connect: {
            id: space.id
          }
        }
      },
      spaceId: space.id,
      userId: user1.id
    });

    const multiSelectMemberProperty = await createMemberProperty({
      data: {
        createdBy: user1.id,
        name: 'Multi Select',
        type: 'multiselect',
        updatedBy: user1.id,
        space: {
          connect: {
            id: space.id
          }
        },
        options: [
          {
            index: 0,
            name: 'Multi Option 1',
            color: 'gray',
            id: v4()
          },
          {
            index: 1,
            name: 'Multi Option 2',
            color: 'gray',
            id: v4()
          }
        ]
      },
      spaceId: space.id,
      userId: user1.id
    });

    const selectMemberProperty = await createMemberProperty({
      data: {
        createdBy: user1.id,
        name: 'Select',
        type: 'select',
        updatedBy: user1.id,
        space: {
          connect: {
            id: space.id
          }
        },
        options: [
          {
            index: 0,
            name: 'Select Option 1',
            color: 'gray',
            id: v4()
          },
          {
            index: 1,
            name: 'Select Option 2',
            color: 'gray',
            id: v4()
          }
        ]
      },
      spaceId: space.id,
      userId: user1.id
    });

    await prisma.memberPropertyValue.create({
      data: {
        updatedBy: user1.id,
        memberPropertyId: textMemberProperty.id,
        userId: user1.id,
        spaceId: space.id,
        value: 'Text Value 1'
      }
    });

    await prisma.memberPropertyValue.create({
      data: {
        updatedBy: user2.id,
        memberPropertyId: textMemberProperty.id,
        userId: user2.id,
        spaceId: space.id,
        value: 'Text Value 2'
      }
    });

    await prisma.memberPropertyValue.create({
      data: {
        updatedBy: user1.id,
        memberPropertyId: selectMemberProperty.id,
        userId: user1.id,
        spaceId: space.id,
        value: (selectMemberProperty.options as { id: string }[])[0].id
      }
    });

    await prisma.memberPropertyValue.create({
      data: {
        updatedBy: user2.id,
        memberPropertyId: selectMemberProperty.id,
        userId: user2.id,
        spaceId: space.id,
        value: (selectMemberProperty.options as { id: string }[])[1].id
      }
    });

    await prisma.memberPropertyValue.create({
      data: {
        updatedBy: user1.id,
        memberPropertyId: multiSelectMemberProperty.id,
        userId: user1.id,
        spaceId: space.id,
        value: [
          (multiSelectMemberProperty.options as { id: string }[])[0].id,
          (multiSelectMemberProperty.options as { id: string }[])[1].id
        ]
      }
    });

    await prisma.memberPropertyValue.create({
      data: {
        updatedBy: user2.id,
        memberPropertyId: multiSelectMemberProperty.id,
        userId: user2.id,
        spaceId: space.id,
        value: [(multiSelectMemberProperty.options as { id: string }[])[1].id]
      }
    });

    const spaceMembersSearchResult1 = await getSpaceMembers({
      spaceId: space.id,
      requestingUserId: user1.id,
      search: 'Text Value 1'
    });

    expect(spaceMembersSearchResult1).toHaveLength(1);
    expect(spaceMembersSearchResult1[0].id).toBe(user1.id);

    const spaceMembersSearchResult2 = await getSpaceMembers({
      spaceId: space.id,
      requestingUserId: user1.id
    });

    expect(spaceMembersSearchResult2).toHaveLength(2);

    expect(
      spaceMembersSearchResult2
        .filter((member) => member.searchValue.includes('select option 1'))
        .map((member) => member.id)
    ).toStrictEqual([user1.id]);

    expect(
      spaceMembersSearchResult2
        .filter((member) => member.searchValue.includes('select option 2'))
        .map((member) => member.id)
    ).toStrictEqual([user2.id]);

    expect(
      spaceMembersSearchResult2
        .filter((member) => member.searchValue.includes('multi option 1'))
        .map((member) => member.id)
    ).toStrictEqual([user1.id]);

    expect(
      spaceMembersSearchResult2
        .filter((member) => member.searchValue.includes('multi option 2'))
        .map((member) => member.id)
    ).toStrictEqual(expect.arrayContaining([user1.id, user2.id]));
  });
});
