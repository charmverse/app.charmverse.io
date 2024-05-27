import { prisma } from '@charmverse/core/prisma-client';
import { APPLICANT_STATUS_BLOCK_ID } from 'lib/rewards/blocks/constants';

export async function rewardSubmissionsBoard() {
  const rewardBlocksBoard = await prisma.rewardBlock.findMany({
    where: {
      id: '__defaultBoardView'
    }
  });

  const rewardBlocksTable = await prisma.rewardBlock.findMany({
    where: {
      id: '__defaultView'
    }
  });

  console.log('🔥', 'Reward Blocks to update:', rewardBlocksBoard.length + rewardBlocksTable.length);

  for (const rewardBlock of rewardBlocksBoard) {
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

  for (const rewardBlock of rewardBlocksTable) {
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
          visiblePropertyIds: [...(rewardBlock.fields as any).visiblePropertyIds, APPLICANT_STATUS_BLOCK_ID]
        }
      }
    });
  }

  console.log('🔥', 'Reward Blocks update done');
}

rewardSubmissionsBoard();
