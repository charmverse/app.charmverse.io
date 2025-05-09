import { prisma } from '@charmverse/core/prisma-client';
import type { CreateCommentInput } from '@packages/lib/comments';

export async function createPageComment({
  content,
  contentText,
  parentId,
  pageId,
  userId
}: CreateCommentInput & {
  pageId: string;
  userId: string;
}) {
  const page = await prisma.page.findUniqueOrThrow({
    where: { id: pageId },
    select: { id: true }
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
