import { prisma } from '@charmverse/core/prisma-client';
import { BoardViewFields } from '@packages/databases/boardView';
import {
  DEFAULT_BOARD_VIEW_BLOCK_ID,
  DEFAULT_CALENDAR_VIEW_BLOCK_ID
} from '@packages/databases/customBlocks/constants';
import { REWARD_AMOUNT } from 'lib/rewards/blocks/constants';

export async function addRewardTokenToVisibleProperty() {
  const rewardBoardBlocks = await prisma.rewardBlock.findMany({
    where: {
      id: {
        in: [DEFAULT_BOARD_VIEW_BLOCK_ID, DEFAULT_CALENDAR_VIEW_BLOCK_ID]
      }
    },
    select: {
      id: true,
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
              id: rewardBoardBlock.id,
              spaceId: rewardBoardBlock.spaceId
            }
          },
          data: {
            fields: {
              ...fields,
              visiblePropertyIds: [...visiblePropertyIds, REWARD_AMOUNT]
            }
          }
        });
      }
    } catch (err) {
      console.log(`Error updating reward board block ${rewardBoardBlock.spaceId}`, err);
    }
    count++;
    console.log(`Updated ${count}/${total} reward board blocks`);
  }
}

addRewardTokenToVisibleProperty();
