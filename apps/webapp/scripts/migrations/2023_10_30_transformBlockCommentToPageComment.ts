import { Prisma, prisma } from '@charmverse/core/prisma-client';

export async function transformBlockCommentToPageComment() {
  const blocks = await prisma.block.findMany({
    where: {
      type: 'comment'
    },
    select: {
      parentId: true,
      fields: true,
      createdBy: true
    }
  });

  for (const block of blocks) {
    const pageId = block.parentId;
    await prisma.pageComment.create({
      data: {
        content: (block.fields as Record<string, any>)?.content ?? Prisma.JsonNull,
        contentText: '',
        pageId,
        createdBy: block.createdBy
      }
    });
  }
}

transformBlockCommentToPageComment();
