import { prisma } from '@charmverse/core/prisma-client';

async function addFarcasterMemberProperty() {
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      createdBy: true,
      memberProperties: {
        select: {
          index: true
        }
      }
    }
  });

  const totalSpaces = spaces.length;
  let countSpaces = 0;
  for (const space of spaces) {
    try {
      const maxIndex = Math.max(...space.memberProperties.map((mp) => mp.index));
      await prisma.memberProperty.create({
        data: {
          createdBy: space.createdBy,
          name: 'Farcaster',
          type: 'farcaster',
          updatedBy: space.createdBy,
          spaceId: space.id,
          enabledViews: [],
          index: maxIndex + 1
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      countSpaces++;
      console.log(`Progress: ${countSpaces}/${totalSpaces}`);
    }
  }
}

addFarcasterMemberProperty().then(() => console.log('Done'));
