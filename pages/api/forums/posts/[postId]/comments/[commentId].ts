import type { PageComment } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { UpdatePageCommentInput } from 'lib/forums/comments/interface';
import { updatePostComment } from 'lib/forums/comments/updatePostComment';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { PageNotFoundError } from 'lib/public-api';
import { withSessionRoute } from 'lib/session/withSession';
import { UserIsNotSpaceMemberError } from 'lib/users/errors';
import { UndesirableOperationError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updatePostCommentHandler);

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

  if (post.status === 'draft') {
    throw new UndesirableOperationError("Can't create comment on drafted posts");
  }

  const postComment = await updatePostComment({ commentId, userId, ...body });

  res.status(200).json(postComment);
}

export default withSessionRoute(handler);
