import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { createPostComment } from 'lib/forums/comments/createPostComment';
import type { CreatePostCommentInput, PostCommentWithVote } from 'lib/forums/comments/interface';
import { listPostComments } from 'lib/forums/comments/listPostComments';
import { PostNotFoundError } from 'lib/forums/posts/errors';
import { InvalidStateError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { requestOperations } from 'lib/permissions/requestOperations';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(listPostCommentsHandler).use(requireUser).post(createPostCommentHandler);

async function listPostCommentsHandler(req: NextApiRequest, res: NextApiResponse<PostCommentWithVote[]>) {
  const { postId } = req.query as any as { postId: string };

  const userId = req.session.user?.id;

  await requestOperations({
    resourceType: 'post',
    operations: ['view_post'],
    resourceId: postId,
    userId
  });

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

  if (post.isDraft) {
    throw new InvalidStateError('Cannot comment on a draft post.');
  }

  await requestOperations({
    resourceType: 'post',
    operations: ['add_comment'],
    resourceId: postId,
    userId
  });

  const postComment = await createPostComment({ postId, userId, ...body });

  res.status(200).json({
    ...postComment,
    upvoted: null,
    upvotes: 0,
    downvotes: 0
  });
}

export default withSessionRoute(handler);
