import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createPostComment } from '@packages/lib/forums/comments/createPostComment';
import type { CreatePostCommentInput, PostCommentWithVote } from '@packages/lib/forums/comments/interface';
import { listPostComments } from '@packages/lib/forums/comments/listPostComments';
import { PostNotFoundError } from '@packages/lib/forums/posts/errors';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { providePermissionClients } from '@packages/lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishDocumentEvent } from '@packages/lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    providePermissionClients({
      key: 'postId',
      location: 'query',
      resourceIdType: 'post'
    })
  )
  .get(listPostCommentsHandler)
  .use(requireUser)
  .post(createPostCommentHandler);

async function listPostCommentsHandler(req: NextApiRequest, res: NextApiResponse<PostCommentWithVote[]>) {
  const { postId } = req.query as any as { postId: string };

  const userId = req.session.user?.id;

  const permissions = await req.basePermissionsClient.forum.computePostPermissions({
    resourceId: postId,
    userId
  });

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

  const permissions = await req.basePermissionsClient.forum.computePostPermissions({
    resourceId: postId,
    userId
  });

  if (!permissions.add_comment) {
    throw new ActionNotPermittedError(`You cannot view this post`);
  }

  const postComment = await createPostComment({ postId, userId, ...body });

  await publishDocumentEvent({
    scope: WebhookEventNames.DocumentCommentCreated,
    spaceId: post.spaceId,
    commentId: postComment.id,
    postId
  });

  res.status(200).json({
    ...postComment,
    upvoted: null,
    upvotes: 0,
    downvotes: 0
  });
}

export default withSessionRoute(handler);
