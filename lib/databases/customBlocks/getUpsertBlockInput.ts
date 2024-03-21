import { InvalidInputError } from '@charmverse/core/errors';
import type { Block, Prisma, PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type { Board } from 'lib/databases/board';
import { createBoard } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/databases/customBlocks/constants';

export function getUpsertBlockInput({
  data: upsertData,
  userId,
  spaceId,
  createOnly = false
}: {
  data: Board | BoardView | Block;
  userId: string;
  spaceId: string;
  tx?: PrismaTransactionClient;
  createOnly?: boolean;
}) {
  if (!upsertData.type || !upsertData.fields) {
    throw new InvalidInputError('Missing required fields');
  }

  const { id: upsertId, rootId, ...data } = upsertData;
  let upsertFields = data.fields;

  const id = data.type === 'board' ? DEFAULT_BOARD_BLOCK_ID : upsertId || v4();

  if (data.type === 'board') {
    upsertFields = createBoard({ block: { fields: { ...(data.fields || ({} as any)) } } }).fields;
  }

  return {
    where: {
      id_spaceId: {
        id,
        spaceId
      }
    },
    update: createOnly
      ? {}
      : {
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
