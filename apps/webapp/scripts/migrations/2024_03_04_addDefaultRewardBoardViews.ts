import { prisma } from '@charmverse/core/prisma-client';
import { BoardFields } from '@packages/databases/board';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/rewards/blocks/constants';
import { defaultRewardViews } from 'lib/rewards/blocks/views';

async function addDefaultRewardBoardViews() {
  const rewardBlocks = await prisma.rewardBlock.findMany({
    where: {
      id: DEFAULT_BOARD_BLOCK_ID
    },
    select: {
      spaceId: true,
      fields: true
    }
  });

  for (const rewardBlock of rewardBlocks) {
    const rewardBlockFields = rewardBlock.fields as unknown as BoardFields;
    if (rewardBlockFields.viewIds.length === 0) {
      await prisma.rewardBlock.update({
        where: {
          id_spaceId: {
            id: DEFAULT_BOARD_BLOCK_ID,
            spaceId: rewardBlock.spaceId
          }
        },
        data: {
          fields: {
            ...rewardBlockFields,
            viewIds: defaultRewardViews
          } as any
        }
      });
    }
  }
}

addDefaultRewardBoardViews();
