import { prisma } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createPostComment } from 'lib/forums/comments/createPostComment';
import type { CreatePostCommentInput, PostCommentWithVote } from 'lib/forums/comments/interface';
import { listPostComments } from 'lib/forums/comments/listPostComments';
import { PostNotFoundError } from 'lib/forums/posts/errors';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { getPermissionsClient } from 'lib/permissions/api/routers';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(listPostCommentsHandler).use(requireUser).post(createPostCommentHandler);

async function listPostCommentsHandler(req: NextApiRequest, res: NextApiResponse<PostCommentWithVote[]>) {
  const { postId } = req.query as any as { postId: string };

  const userId = req.session.user?.id;

  const permissions = await getPermissionsClient({
    resourceId: postId,
    resourceIdType: 'post'
  }).then(({ forum }) =>
    forum.computePostPermissions({
      resourceId: postId,
      userId
    })
  );

  if (!permissions.view_post) {
    throw new ActionNotPermittedError(`You cannot view this post`);
  }

  const postCommentsWithVotes = await listPostComments({ postId, userId });

  res.status(200).json(postCommentsWithVotes);
}

async function createPostCommentHandler(req: NextApiRequest, res: NextApiResponse<PostCommentWithVote>) {
  const { postId } = req.query as any as { postId: string };
  const body = req.body as CreatePostCommentInput;
  const userId = req.session.user.id;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { spaceId: true, isDraft: true }
  });

  if (!post) {
    throw new PostNotFoundError(postId);
  }

  const permissions = await getPermissionsClient({
    resourceId: postId,
    resourceIdType: 'post'
  }).then(({ forum }) =>
    forum.computePostPermissions({
      resourceId: postId,
      userId
    })
  );

  if (!permissions.add_comment) {
    throw new ActionNotPermittedError(`You cannot view this post`);
  }

  const postComment = await createPostComment({ postId, userId, ...body });

  res.status(200).json({
    ...postComment,
    upvoted: null,
    upvotes: 0,
    downvotes: 0
  });
}

export default withSessionRoute(handler);
