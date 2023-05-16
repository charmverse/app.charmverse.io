import { prisma } from '@charmverse/core';
import type { Page, Prisma, PrismaPromise } from '@charmverse/core/prisma';

import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { extractPreviewImage } from 'lib/prosemirror/extractPreviewImage';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { generateFirstDiff } from './generateFirstDiff';

export function createPage<T>({ data, include }: Prisma.PageCreateArgs): PrismaPromise<Page & T> {
  const hasContent = data.content ? !checkIsContentEmpty(data.content as PageContent) : false;
  const createArgs: Prisma.PageCreateArgs = {
    data: {
      ...data,
      hasContent,
      galleryImage: extractPreviewImage(data.content as PageContent)
    }
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

  const includeData =
    typeof include !== undefined
      ? include
      : {
          permissions: {
            include: {
              sourcePermission: true
            }
          }
        };

  createArgs.include = includeData;

  return prisma.page.create(createArgs) as unknown as PrismaPromise<Page & T>;
}
