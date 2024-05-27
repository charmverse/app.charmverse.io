import { prisma } from '@charmverse/core/prisma-client';

export async function rewardSubmissionsBoard() {
  const rewardBlocks = await prisma.rewardBlock.findMany({
    where: {
      id: '__defaultBoardView'
    }
  });

  console.log('🔥', 'Reward Blocks to update:', rewardBlocks.length);

  for (const rewardBlock of rewardBlocks) {
    await prisma.rewardBlock.update({
      where: {
        id_spaceId: {
          id: rewardBlock.id,
          spaceId: rewardBlock.spaceId
        }
      },
      data: {
        fields: {
          ...(rewardBlock.fields as any),
          sourceType: 'rewards'
        }
      }
    });
  }

  console.log('🔥', 'Reward Blocks update done');
}

rewardSubmissionsBoard();
