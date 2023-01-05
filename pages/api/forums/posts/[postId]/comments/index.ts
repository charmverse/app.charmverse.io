import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { createPostComment } from 'lib/forums/comments/createPostComment';
import type { CreatePostCommentInput, PostCommentWithVote } from 'lib/forums/comments/interface';
import { listPostComments } from 'lib/forums/comments/listPostComments';
import { PostNotFoundError } from 'lib/forums/posts/errors';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(listPostCommentsHandler).post(createPostCommentHandler);

async function listPostCommentsHandler(req: NextApiRequest, res: NextApiResponse<PostCommentWithVote[]>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  const postCommentsWithVotes = await listPostComments({ postId, userId });

  res.status(200).json(postCommentsWithVotes);
}

async function createPostCommentHandler(req: NextApiRequest, res: NextApiResponse<PostCommentWithVote>) {
  const { postId } = req.query as any as { postId: string };
  const body = req.body as CreatePostCommentInput;
  const userId = req.session.user.id;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { spaceId: true }
  });

  if (!post) {
    throw new PostNotFoundError(postId);
  }

  const { error } = await hasAccessToSpace({
    spaceId: post.spaceId,
    userId
  });

  if (error) {
    throw error;
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
