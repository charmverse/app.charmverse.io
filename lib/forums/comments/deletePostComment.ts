import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { UnauthorisedActionError } from 'lib/utilities/errors';

export async function deletePostComment({
  postId,
  commentId,
  userId
}: {
  postId: string;
  commentId: string;
  userId: string;
}) {
  const pageComment = await prisma.pageComment.findFirst({
    where: {
      id: commentId,
      createdBy: userId,
      deletedAt: null
    }
  });

  if (!pageComment) {
    throw new UnauthorisedActionError();
  }

  const page = await prisma.page.findUnique({
    where: { id: postId },
    include: {
      post: {
        include: {
          category: true
        }
      }
    }
  });

  const category = page?.post?.category;

  await prisma.pageComment.update({
    where: {
      id: commentId
    },
    data: {
      deletedAt: new Date(),
      content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
      contentText: ''
    }
  });

  if (category) {
    trackUserAction('delete_comment', {
      categoryName: category.name,
      commentedOn: pageComment.parentId === postId ? 'post' : 'comment',
      postId,
      resourceId: commentId,
      spaceId: page.spaceId,
      userId
    });
  }
}
