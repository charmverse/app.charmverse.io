import type { Page, Prisma, PrismaPromise } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { extractPreviewImage } from 'lib/prosemirror/extractPreviewImage';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { generateFirstDiff } from './generateFirstDiff';

export function createPage<T = Page>({
  data,
  include,
  tx = prisma
}: Prisma.PageCreateArgs & { tx?: Prisma.TransactionClient }): PrismaPromise<T> {
  const hasContent = data.content ? !checkIsContentEmpty(data.content as PageContent) : false;
  const createArgs: Prisma.PageCreateArgs = {
    data: {
      ...data,
      hasContent,
      galleryImage: extractPreviewImage(data.content as PageContent)
    },
    include
  };

  if (hasContent) {
    createArgs.data.diffs = {
      create: generateFirstDiff({
        // We should be receiving the data from one of these
        createdBy: data.createdBy ?? (data.author?.connect?.id as string),
        content: data.content
      })
    };
  }

  return tx.page.create(createArgs) as unknown as PrismaPromise<T>;
}
