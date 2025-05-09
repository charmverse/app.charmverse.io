import type { Page, Prisma, PrismaPromise } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { checkIsContentEmpty } from '@packages/charmeditor/utils/checkIsContentEmpty';
import { extractPreviewImage } from '@packages/charmeditor/utils/extractPreviewImage';

import { generateFirstDiff } from './generateFirstDiff';

export function createPage<T = Page>({
  data,
  include,
  tx = prisma
}:
  | { data: Prisma.PageCreateInput; tx?: Prisma.TransactionClient; include?: Prisma.PageInclude }
  | (Prisma.PageCreateArgs & { tx?: Prisma.TransactionClient })): PrismaPromise<T> {
  const hasContent = data.content ? !checkIsContentEmpty(data.content as PageContent) : false;

  // this is one of the two formats to pass in data
  const plainDataInput = data as Prisma.PageCreateArgs['data'];

  const createArgs: { data: Prisma.PageCreateInput } = {
    data: {
      ...data,
      // apply parent based on the type of input we're using with Prisma
      // @ts-ignore
      parentId: data.author ? undefined : data.parentId,
      // @ts-ignore
      parent:
        data.parent ||
        (data.author && plainDataInput.parentId ? { connect: { id: plainDataInput.parentId } } : undefined),
      hasContent,
      galleryImage: extractPreviewImage(data.content as PageContent)
    },
    include
  };

  if (hasContent) {
    createArgs.data.diffs = {
      create: generateFirstDiff({
        // We should be receiving the data from one of these
        createdBy: plainDataInput.createdBy ?? (data.author?.connect?.id as string),
        content: data.content
      })
    };
  }

  return tx.page.create(createArgs) as unknown as PrismaPromise<T>;
}
