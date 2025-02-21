import type { PostComment } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { UserIsNotSpaceMemberError } from '@packages/users/errors';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import { DataNotFoundError, UndesirableOperationError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { deletePostComment } from 'lib/forums/comments/deletePostComment';
import { getPostComment } from 'lib/forums/comments/getPostComment';
import type { UpdatePostCommentInput } from 'lib/forums/comments/interface';
import { updatePostComment } from 'lib/forums/comments/updatePostComment';
import { PostNotFoundError } from 'lib/forums/posts/errors';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });
handler
  .use(
    providePermissionClients({
      key: 'postId',
      location: 'query',
      resourceIdType: 'post'
    })
  )
  .use(requireUser)
  .put(updatePostCommentHandler)
  .delete(deletePostCommentHandler);

async function updatePostCommentHandler(req: NextApiRequest, res: NextApiResponse<PostComment>) {
  const { commentId, postId } = req.query as any as { postId: string; commentId: string };
  const body = req.body as UpdatePostCommentInput;
  const userId = req.session.user.id;

  const post = await prisma.post.findUnique({
    where: { id: postId }
  });

  if (!post) {
    throw new PostNotFoundError(postId);
  }

  if (post.proposalId) {
    throw new ActionNotPermittedError('You do not have permission to edit this comment.');
  }

  const spaceRole = await hasAccessToSpace({
    spaceId: post.spaceId,
    userId
  });

  if (!spaceRole.success) {
    throw new UserIsNotSpaceMemberError();
  }

  const comment = await getPostComment(commentId);

  if (comment?.createdBy !== userId) {
    throw new ActionNotPermittedError(`You cannot edit other peoples' comments`);
  }

  if (comment.deletedAt) {
    throw new UndesirableOperationError("Can't edit deleted comments");
  }

  const postComment = await updatePostComment({ commentId, ...body });

  res.status(200).json(postComment);
}

async function deletePostCommentHandler(req: NextApiRequest, res: NextApiResponse) {
  const { commentId, postId } = req.query as any as { postId: string; commentId: string };
  const userId = req.session.user.id;

  const post = await prisma.post.findUnique({
    where: { id: postId }
  });

  if (!post) {
    throw new PostNotFoundError(postId);
  }

  if (post.proposalId) {
    throw new ActionNotPermittedError('You do not have permission to delete this comment.');
  }

  const postComment = await prisma.postComment.findUnique({
    where: { id: commentId },
    include: {
      post: {
        select: {
          spaceId: true
        }
      }
    }
  });

  if (!postComment) {
    throw new DataNotFoundError(`Comment with id ${commentId} not found`);
  }

  const permissions = await req.basePermissionsClient.forum.computePostPermissions({
    resourceId: postId,
    userId: req.session.user.id
  });

  if (permissions.delete_comments || postComment.createdBy === userId) {
    await deletePostComment({ commentId, userId });
  } else {
    throw new ActionNotPermittedError('You do not have permission to delete this comment.');
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
