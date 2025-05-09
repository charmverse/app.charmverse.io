import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import type { BoardFields } from '@packages/databases/board';
import { DEFAULT_BOARD_VIEW_BLOCK_ID, DEFAULT_TABLE_VIEW_BLOCK_ID } from '@packages/databases/customBlocks/constants';

import { DEFAULT_BOARD_BLOCK_ID } from '../constants';
import { upsertDefaultRewardsBoard } from '../upsertDefaultRewardsBoard';
import { defaultRewardViews } from '../views';

describe('reward blocks - upsertDefaultRewardsBoard', () => {
  it('Should create board and view blocks if it does not exist for the space', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    await upsertDefaultRewardsBoard({
      spaceId: space.id,
      userId: adminUser.id
    });

    const defaultRewardBoard = await prisma.rewardBlock.findUniqueOrThrow({
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId: space.id
        }
      }
    });

    const defaultRewardTableView = await prisma.rewardBlock.findUniqueOrThrow({
      where: {
        id_spaceId: {
          id: DEFAULT_TABLE_VIEW_BLOCK_ID,
          spaceId: space.id
        }
      }
    });

    const defaultRewardBoardView = await prisma.rewardBlock.findUniqueOrThrow({
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_VIEW_BLOCK_ID,
          spaceId: space.id
        }
      }
    });

    expect(defaultRewardBoard).toBeTruthy();
    expect((defaultRewardBoard.fields as unknown as BoardFields).viewIds.sort()).toStrictEqual(
      defaultRewardViews.sort()
    );

    expect(defaultRewardTableView).toBeTruthy();
    expect(defaultRewardBoardView).toBeTruthy();
  });

  it('Should keep existing board data when board already exists', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    await upsertDefaultRewardsBoard({
      spaceId: space.id,
      userId: adminUser.id
    });

    await prisma.rewardBlock.update({
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId: space.id
        }
      },
      data: {
        fields: {
          viewIds: [defaultRewardViews[0]]
        }
      }
    });

    await upsertDefaultRewardsBoard({
      spaceId: space.id,
      userId: adminUser.id
    });

    const defaultRewardBoard = await prisma.rewardBlock.findUniqueOrThrow({
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId: space.id
        }
      }
    });

    expect(defaultRewardBoard).toBeTruthy();
    expect((defaultRewardBoard.fields as unknown as BoardFields).viewIds).toStrictEqual([defaultRewardViews[0]]);
  });
});
