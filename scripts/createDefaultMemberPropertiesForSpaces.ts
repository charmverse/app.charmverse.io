import { prisma } from 'db';
import { generateDefaultPropertiesInput } from 'lib/members/generateDefaultPropertiesInput';

async function createDefaultMemberPropertiesForSpaces (): Promise<any> {
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      createdBy: true
    }
  });

  for (const space of spaces) {
    await prisma.memberProperty.createMany({
      data: generateDefaultPropertiesInput({
        spaceId: space.id,
        userId: space.createdBy
      })
    });
  }

}

/*
createDefaultMemberPropertiesForSpaces()
  .then(() => {
    console.log('Success!');
  });
*/
