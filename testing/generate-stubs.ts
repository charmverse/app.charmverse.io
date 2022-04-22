import { Page, Prisma } from '@prisma/client';
import { v4 } from 'uuid';

export function generatePageToCreateStub (options: {userId: string, spaceId: string, title?: string, parentId?: string}): Prisma.PageCreateInput {
  return {
    author: {
      connect: {
        id: options.userId
      }
    },
    contentText: '',
    path: v4(),
    title: options.title || 'Root',
    type: 'page',
    updatedBy: options.userId,
    space: {
      connect: {
        id: options.spaceId
      }
    },
    parentId: options.parentId
  };
}
