import { togglePublicBounties } from 'lib/spaces/togglePublicBounties';
import { prisma } from 'db';

/**
 * Ensures old bounty boards that were made public before public bounties update that manages permissions
 */
async function migrate(): Promise<true> {
  const targetSpaces = await prisma.space.findMany({
    where: {
      publicBountyBoard: true
    }
  })

  const totalSpaces = targetSpaces.length;

  for (let i = 0; i < targetSpaces.length; i++) {
    const space = targetSpaces[i];
    console.log('Processing space ', i +1, ' of ', totalSpaces);
    await togglePublicBounties({spaceId: space.id, publicBountyBoard: true});
  }

  return true;
}

// migrate().then(() => console.log('Job done'))
// .catch((e) => console.error(e));