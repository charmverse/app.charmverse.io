import { prisma } from '@charmverse/core';
import type { Page, Prisma, PrismaPromise } from '@charmverse/core/dist/prisma';

import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { emptyDocument } from 'lib/prosemirror/constants';
import { extractPreviewImage } from 'lib/prosemirror/extractPreviewImage';
import type { PageContent } from 'lib/prosemirror/interfaces';

export function createPage<T>({ data, include }: Prisma.PageCreateArgs): PrismaPromise<Page & T> {
  const createArgs: Prisma.PageCreateArgs = {
    data: {
      ...data,
      hasContent: data.content ? !checkIsContentEmpty(data.content as PageContent) : false,
      galleryImage: extractPreviewImage(data.content as PageContent),
      diffs: {
        create: {
          createdBy: (data.createdBy ?? data.author.connect?.id) as string,
          data: (data.content ?? emptyDocument) as Prisma.InputJsonValue,
          version: 0
        }
      }
    }
  };

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
