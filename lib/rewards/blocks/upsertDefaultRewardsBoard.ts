import { prisma } from '@charmverse/core/prisma-client';

import { blockToPrisma } from 'lib/databases/block';
import type { BoardFields, IPropertyTemplate } from 'lib/databases/board';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/databases/customBlocks/constants';

import { upsertBlock } from './upsertBlock';
import {
  defaultRewardViews,
  generateDefaultBoardView,
  generateDefaultCalendarView,
  generateDefaultTableView
} from './views';

export async function upsertDefaultRewardsBoard({ spaceId, userId }: { spaceId: string; userId?: string }) {
  let updateUserId = userId;
  if (!updateUserId) {
    const adminUserRole = await prisma.spaceRole.findFirst({
      where: { spaceId, isAdmin: true },
      select: { userId: true }
    });
    updateUserId = adminUserRole?.userId;
  }

  if (!updateUserId) {
    throw new Error('User id not found, cannot create default rewards board');
  }

  // safety check - if default board exists, do not override existing fields
  const existingBlock = await prisma.rewardBlock.findUnique({
    where: {
      id_spaceId: {
        id: DEFAULT_BOARD_BLOCK_ID,
        spaceId
      }
    }
  });

  let fields = { viewIds: defaultRewardViews, cardProperties: [] as IPropertyTemplate[] } as BoardFields;
  if (existingBlock) {
    const existingFields = existingBlock.fields as unknown as BoardFields;
    const viewIds = existingFields?.viewIds?.length ? existingFields?.viewIds : defaultRewardViews;
    const cardProperties = existingFields?.cardProperties?.length ? existingFields?.cardProperties : [];

    fields = { ...(existingBlock.fields as unknown as BoardFields), cardProperties, viewIds };
  }

  // generate / update existing board with 3 default views
  await upsertBlock({
    spaceId,
    userId: updateUserId,
    data: {
      type: 'board',
      id: DEFAULT_BOARD_BLOCK_ID,
      fields
    }
  });

  // table view
  await upsertBlock({
    spaceId,
    userId: updateUserId,
    data: generateDefaultTableView({ spaceId }),
    // do not override view if it exists already
    createOnly: true
  });

  // board view
  await upsertBlock({
    spaceId,
    userId: updateUserId,
    data: generateDefaultBoardView({ spaceId }),
    // do not override view if it exists already
    createOnly: true
  });

  // // calendar view
  await upsertBlock({
    spaceId,
    userId: updateUserId,
    data: generateDefaultCalendarView({ spaceId }),
    // do not override view if it exists already
    createOnly: true
  });
}
