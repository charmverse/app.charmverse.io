import { prisma } from 'db';

import type { CreatePageCommentInput } from './interface';

export async function createPageComment({
  content,
  contentText,
  parentId,
  pageId,
  userId
}: CreatePageCommentInput & {
  pageId: string;
  userId: string;
}) {
  const page = await prisma.page.findUniqueOrThrow({
    where: { id: pageId }
  });

  const comment = await prisma.pageComment.create({
    data: {
      content,
      contentText: contentText.trim(),
      parentId,
      user: {
        connect: {
          id: userId
        }
      },
      page: {
        connect: {
          id: page.id
        }
      }
    }
  });

  return comment;
}
