import { prisma } from '@charmverse/core/prisma-client';
import { countSpaceBlocksAndSave, countSpaceBlocks } from 'lib/spaces/countSpaceBlocks/countAllSpaceBlocks';
import { writeToSameFolder } from 'lib/utils/file';

// Manually generate block count for a space
async function init({ spaceDomain }: { spaceDomain: string }) {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain: spaceDomain
    }
  });

  const count = await countSpaceBlocks({
    spaceId: space!.id
  });

  await writeToSameFolder({ data: JSON.stringify(count, null, 2), fileName: 'charmverse.json' });
}

init({ spaceDomain: 'charmverse' }).then(() => {
  console.log('done');
});
