import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import { countMemberProperties } from '../countMemberProperties';

describe('countSpacePages', () => {
  it('should return the correct total count of member properties', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const props = await prisma.memberProperty.createMany({
      data: [
        {
          createdBy: space.createdBy,
          name: 'Test prop 1',
          spaceId: space.id,
          type: 'text',
          updatedBy: space.createdBy
        },
        {
          createdBy: space.createdBy,
          name: 'Test prop 1',
          spaceId: space.id,
          type: 'text',
          updatedBy: space.createdBy
        }
      ]
    });

    // Call the function to be tested
    const countedPropertyCounts = await countMemberProperties({ spaceId: space.id });

    // Check that the manually counted total matches the total returned by the function
    expect(countedPropertyCounts.details.properties).toBe(2);
    expect(countedPropertyCounts.total).toBe(2);
  });
});
