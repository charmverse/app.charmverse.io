import type { Prisma } from '@charmverse/core/prisma-client';
import { PrismaClient } from '@charmverse/core/prisma-client';

import { InvalidInputError } from './errors';

type PrismaModel = Extract<Uncapitalize<Prisma.ModelName>, 'block' | 'page' | 'post' | 'proposal'>;

type PrismaArgs<M extends PrismaModel> = Pick<
  M extends 'block'
    ? Prisma.BlockFindManyArgs
    : M extends 'page'
    ? Prisma.PageFindManyArgs
    : M extends 'post'
    ? Prisma.PostFindManyArgs
    : M extends 'proposal'
    ? Prisma.ProposalFindManyArgs
    : never,
  'select' | 'where' | 'include'
>;

type BatchProcessor<R> = (records: any[]) => R | Promise<R>;

type PaginatedTask<M extends PrismaModel, R> = {
  model: M;
  queryOptions: PrismaArgs<M>;
  batchSize: number;
  callback: BatchProcessor<R>;
};

export async function paginatedPrismaTask<M extends PrismaModel = PrismaModel, R = unknown>({
  batchSize,
  callback,
  model,
  queryOptions
}: PaginatedTask<M, R>): Promise<R[]> {
  if (queryOptions.select && queryOptions.include) {
    throw new InvalidInputError(`Cannot provide select AND include. Pick one or none`);
  } else if (queryOptions.select && !queryOptions.select.id) {
    throw new InvalidInputError(`Query options for ${model} must select at least id or include additional records`);
  }

  const prisma = new PrismaClient();

  let cursor: string | undefined;

  const allProcessedResults: R[] = [];

  while (true) {
    // Typecast model to page to get a good example of how to use the PrismaClient, since generic is tricky
    const results = await prisma[model as 'page'].findMany({
      ...(queryOptions as Prisma.PageFindManyArgs),
      cursor: cursor ? { id: cursor } : undefined,
      take: batchSize,
      skip: cursor ? 1 : undefined,
      orderBy: {
        id: 'asc'
      }
    });

    if (results.length === 0) break;

    const processedResults = await callback(results as any);

    allProcessedResults.push(processedResults);

    cursor = results[results.length - 1].id;

    if (results.length < batchSize) break;
  }

  return allProcessedResults;
}
