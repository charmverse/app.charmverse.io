import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma, PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { createBoard } from 'lib/focalboard/board';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/proposal/blocks/constants';
import type { RewardBlockInput, RewardBlockUpdateInput } from 'lib/rewards/blocks/interfaces';

export function upsertBlock({
  data: upsertData,
  userId,
  spaceId,
  tx = prisma
}: {
  data: RewardBlockUpdateInput | RewardBlockInput;
  userId: string;
  spaceId: string;
  tx?: PrismaTransactionClient;
}) {
  if (!upsertData.type || !upsertData.fields) {
    throw new InvalidInputError('Missing required fields');
  }

  const { id: upsertId, ...data } = upsertData;
  let upsertFields = data.fields;

  const id = data.type === 'board' ? DEFAULT_BOARD_BLOCK_ID : upsertId || v4();

  if (data.type === 'board') {
    // add default bord fields, TODO: insert all default view ids (__defaultView, __defaultBoardView, __defaultCalendarView)
    upsertFields = createBoard({ block: { fields: { viewIds: [], ...data.fields } } }).fields;
  }

  return tx.rewardBlock.upsert({
    where: {
      id_spaceId: {
        id,
        spaceId
      },
      type: data.type
    },
    update: {
      ...data,
      spaceId,
      fields: (data.fields || {}) as unknown as Prisma.JsonNullValueInput | Prisma.InputJsonValue,
      updatedBy: userId
    },
    create: {
      id,
      ...data,
      spaceId,
      rootId: spaceId,
      createdBy: userId,
      updatedBy: userId,
      parentId: data.parentId || '',
      title: data.title || '',
      schema: 1,
      fields: upsertFields as unknown as Prisma.JsonNullValueInput | Prisma.InputJsonValue
    }
  });
}
