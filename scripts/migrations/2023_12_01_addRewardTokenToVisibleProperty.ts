import { prisma } from '@charmverse/core/prisma-client';
import { BoardViewFields } from 'lib/focalboard/boardView';
import { DEFAULT_BOARD_VIEW_BLOCK_ID } from 'lib/focalboard/customBlocks/constants';
import { REWARD_AMOUNT } from 'lib/rewards/blocks/constants';

export async function addRewardTokenToVisibleProperty() {
  const rewardBoardBlocks = await prisma.rewardBlock.findMany({
    where: {
      id: DEFAULT_BOARD_VIEW_BLOCK_ID
    },
    select: {
      spaceId: true,
      fields: true
    }
  });

  const total = rewardBoardBlocks.length;
  let count = 0;

  for (const rewardBoardBlock of rewardBoardBlocks) {
    try {
      const fields = rewardBoardBlock.fields as BoardViewFields;
      const visiblePropertyIds = fields?.visiblePropertyIds || [];
      const isRewardAmountVisible = visiblePropertyIds.includes(REWARD_AMOUNT);
      if (!isRewardAmountVisible) {
        await prisma.rewardBlock.update({
          where: {
            id_spaceId: {
              id: DEFAULT_BOARD_VIEW_BLOCK_ID,
              spaceId: rewardBoardBlock.spaceId
            }
          },
          data: {
            fields: {
              ...fields,
              visiblePropertyIds: [...visiblePropertyIds, REWARD_AMOUNT]
            }
          }
        })
      }
    } catch (err) {
      console.log(`Error updating reward board block ${rewardBoardBlock.spaceId}`, err);
    }
    count++;
    console.log(`Updated ${count}/${total} reward board blocks`);
  }
}

addRewardTokenToVisibleProperty();