import type { Prisma, Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { Types } from '@prisma/client/runtime/library';

type Result<T extends Prisma.PageSelect | null> = Prisma.Prisma__PageClient<
  Types.Result.GetResult<Prisma.$PagePayload, { select: T }, 'findUnique'>,
  never
>;

export function getPageByBlockId<T extends Prisma.PageSelect>(blockId: string, select: T): Result<T>;
export function getPageByBlockId(blockId: string): Promise<Page | null>;

export async function getPageByBlockId<T extends Prisma.PageSelect | null>(blockId: string, select?: T) {
  return prisma.page.findFirst({
    where: {
      OR: [{ boardId: blockId }, { cardId: blockId }]
    },
    select
  }) as Result<T | null> | Promise<Page | null>;
}
