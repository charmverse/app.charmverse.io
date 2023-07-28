
import { countSpaceBlocks, countSpaceBlocksAndSave } from 'lib/spaces/countSpaceBlocks';
import { prisma } from '@charmverse/core/prisma-client';
import { writeFileSync } from 'fs';



// Manually generate block count for a space
async function init({spaceDomain}: {spaceDomain: string}) {

  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  });

  await countSpaceBlocksAndSave({
    spaceId: space!.id,
  });
}

init({spaceDomain: 'devoted-flip-impala'}).then(() => {
  console.log('done');
});
