import type { PageComment } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { deletePostComment } from 'lib/forums/comments/deletePostComment';
import type { UpdatePageCommentInput } from 'lib/forums/comments/interface';
import { updatePostComment } from 'lib/forums/comments/updatePostComment';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { PageNotFoundError } from 'lib/public-api';
import { withSessionRoute } from 'lib/session/withSession';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updatePostCommentHandler).delete(deletePostCommentHandler);

async function updatePostCommentHandler(req: NextApiRequest, res: NextApiResponse<PageComment>) {
  const { postId, commentId } = req.query as any as { postId: string; commentId: string };
  const body = req.body as UpdatePageCommentInput;
  const userId = req.session.user.id;

  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      page: {
        select: {
          spaceId: true
        }
      },
      status: true
    }
  });

  if (!post || !post.page) {
    throw new PageNotFoundError(postId);
  }

  const spaceRole = await hasAccessToSpace({
    spaceId: post.page.spaceId,
    userId
  });

  if (!spaceRole.success) {
    throw new UserIsNotSpaceMemberError();
  }

  const postComment = await updatePostComment({ commentId, userId, ...body });

  res.status(200).json(postComment);
}

async function deletePostCommentHandler(req: NextApiRequest, res: NextApiResponse) {
  const { postId, commentId } = req.query as any as { postId: string; commentId: string };
  const userId = req.session.user.id;

  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      page: {
        select: {
          spaceId: true
        }
      },
      status: true
    }
  });

  if (!post || !post.page) {
    throw new PageNotFoundError(postId);
  }

  const spaceRole = await hasAccessToSpace({
    spaceId: post.page.spaceId,
    userId
  });

  if (!spaceRole.success) {
    throw new UserIsNotSpaceMemberError();
  }

  await deletePostComment({ commentId, userId });

  res.status(200).json({});
}

export default withSessionRoute(handler);
