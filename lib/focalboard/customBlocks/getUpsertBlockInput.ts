import { InvalidInputError } from '@charmverse/core/errors';
import type { Block, Prisma, PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type { Board } from 'lib/focalboard/board';
import { createBoard } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/focalboard/customBlocks/constants';

export function getUpsertBlockInput({
  data: upsertData,
  userId,
  spaceId
}: {
  data: Board | BoardView | Block;
  userId: string;
  spaceId: string;
  tx?: PrismaTransactionClient;
}) {
  if (!upsertData.type || !upsertData.fields) {
    throw new InvalidInputError('Missing required fields');
  }

  const { id: upsertId, rootId, ...data } = upsertData;
  let upsertFields = data.fields;

  const id = data.type === 'board' ? DEFAULT_BOARD_BLOCK_ID : upsertId || v4();

  if (data.type === 'board') {
    // add default bord fields, TODO: insert all default view ids (__defaultView, __defaultBoardView, __defaultCalendarView)
    upsertFields = createBoard({ block: { fields: { ...(data.fields || ({} as any)) } } }).fields;
  }

  return {
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
      updatedBy: userId,
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : undefined,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
    },
    create: {
      id,
      ...data,
      spaceId,
      deletedAt: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      rootId: rootId || spaceId,
      createdBy: userId,
      updatedBy: userId,
      parentId: data.parentId || '',
      title: data.title || '',
      schema: 1,
      fields: upsertFields as unknown as Prisma.JsonNullValueInput | Prisma.InputJsonValue
    }
  };
}
