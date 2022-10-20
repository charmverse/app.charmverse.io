import { prisma } from 'db';
import { MEMBER_PROPERTY_LABELS, DEFAULT_MEMBER_PROPERTIES } from 'lib/members/constants';

async function createDefaultMemberPropertiesForSpaces (): Promise<any> {
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      createdBy: true
    }
  });

  for (const space of spaces) {
    await prisma.memberProperty.createMany({
      data: DEFAULT_MEMBER_PROPERTIES.map(memberProperty => ({
        createdBy: space.createdBy,
        name: MEMBER_PROPERTY_LABELS[memberProperty],
        type: memberProperty,
        spaceId: space.id,
        updatedBy: space.createdBy
      }))
    });
  }

}

/*
createDefaultMemberPropertiesForSpaces()
  .then(() => {
    console.log('Success!');
  });
*/
