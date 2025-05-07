import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import type { MemberPropertyCounts } from '../countMemberProperties';
import { countMemberProperties } from '../countMemberProperties';

describe('countMemberProperties', () => {
  it('should return the correct total count of member properties and member property values', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const props = await Promise.all([
      prisma.memberProperty.create({
        data: {
          createdBy: space.createdBy,
          name: 'Test prop 1',
          spaceId: space.id,
          type: 'text',
          updatedBy: space.createdBy
        }
      }),
      prisma.memberProperty.create({
        data: {
          createdBy: space.createdBy,
          name: 'Test prop 1',
          spaceId: space.id,
          type: 'text',
          updatedBy: space.createdBy
        }
      })
    ]);

    const propValues = await prisma.memberPropertyValue.createMany({
      data: [
        {
          memberPropertyId: props[0].id,
          spaceId: space.id,
          updatedBy: user.id,
          userId: user.id,
          value: 'Text'
        },
        {
          memberPropertyId: props[1].id,
          spaceId: space.id,
          updatedBy: user.id,
          userId: user.id,
          value: 'Text'
        },
        {
          memberPropertyId: props[0].id,
          spaceId: space.id,
          updatedBy: spaceMember.id,
          userId: spaceMember.id,
          value: 'Text'
        },
        {
          memberPropertyId: props[1].id,
          spaceId: space.id,
          updatedBy: spaceMember.id,
          userId: spaceMember.id,
          value: 'Text'
        }
      ]
    });

    const countedPropertyCounts = await countMemberProperties({ spaceId: space.id });

    expect(countedPropertyCounts).toMatchObject<MemberPropertyCounts>({
      total: 6,
      details: {
        memberProperties: 2,
        memberPropertyValues: 4
      }
    });
  });

  it('should ignore values for users who do not belong to the space as well as empty values', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const externalUser = await testUtilsUser.generateUser();

    const props = await Promise.all([
      prisma.memberProperty.create({
        data: {
          createdBy: space.createdBy,
          name: 'Test prop 1',
          spaceId: space.id,
          type: 'text',
          updatedBy: space.createdBy
        }
      }),
      prisma.memberProperty.create({
        data: {
          createdBy: space.createdBy,
          name: 'Test prop 1',
          spaceId: space.id,
          type: 'text',
          updatedBy: space.createdBy
        }
      })
    ]);

    const propValues = await prisma.memberPropertyValue.createMany({
      data: [
        {
          memberPropertyId: props[0].id,
          spaceId: space.id,
          updatedBy: user.id,
          userId: user.id,
          // Empty value
          value: ''
        },
        {
          memberPropertyId: props[1].id,
          spaceId: space.id,
          updatedBy: user.id,
          userId: user.id,
          // Empty array
          value: []
        },
        {
          memberPropertyId: props[0].id,
          spaceId: space.id,
          updatedBy: spaceMember.id,
          userId: spaceMember.id,
          value: 'Text'
        },
        {
          memberPropertyId: props[1].id,
          spaceId: space.id,
          updatedBy: spaceMember.id,
          userId: spaceMember.id,
          value: 0
        },
        // These values should be excluded since user is not a member
        {
          memberPropertyId: props[0].id,
          spaceId: space.id,
          updatedBy: externalUser.id,
          userId: externalUser.id,
          value: 'Text'
        },
        {
          memberPropertyId: props[1].id,
          spaceId: space.id,
          updatedBy: externalUser.id,
          userId: externalUser.id,
          value: 'Text'
        }
      ]
    });

    const countedPropertyCounts = await countMemberProperties({ spaceId: space.id });

    expect(countedPropertyCounts).toMatchObject<MemberPropertyCounts>({
      total: 4,
      details: {
        memberProperties: 2,
        memberPropertyValues: 2
      }
    });
  });
});
