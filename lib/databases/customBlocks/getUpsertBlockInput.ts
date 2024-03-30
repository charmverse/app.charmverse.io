import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma, PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { blockToPrisma, blockToPrismaPartial } from 'lib/databases/block';
import type { Board } from 'lib/databases/board';
import { createBoard } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/databases/customBlocks/constants';
import type { ProposalBlockInput, ProposalBlockUpdateInput } from 'lib/proposals/blocks/interfaces';
import type { RewardBlockInput, RewardBlockUpdateInput } from 'lib/rewards/blocks/interfaces';

export function getUpsertBlockInput({
  data: upsertData,
  userId,
  spaceId,
  createOnly = false
}: {
  data: Board | BoardView | ProposalBlockInput | ProposalBlockUpdateInput | RewardBlockInput | RewardBlockUpdateInput;
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
      : blockToPrismaPartial({
          ...data,
          spaceId,
          updatedBy: userId
        }),
    create: blockToPrisma({
      id,
      ...data,
      spaceId,
      rootId: rootId || spaceId,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      createdBy: userId,
      updatedBy: userId,
      parentId: data.parentId || '',
      title: data.title || '',
      fields: upsertFields || {}
    })
  };
}
