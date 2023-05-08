import type { PostOperation } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { voteForumPost } from 'lib/forums/posts/voteForumPost';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { getPermissionsClient } from 'lib/permissions/api';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(voteForumPostHandler);

async function voteForumPostHandler(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  const { upvoted } = req.body;

  const permissions = await getPermissionsClient({
    resourceId: postId,
    resourceIdType: 'post'
  }).then(({ forum }) =>
    forum.computePostPermissions({
      resourceId: postId,
      userId
    })
  );

  // Don't check permissions for a user deleting their own vote
  const operation: PostOperation | null = upvoted === true ? 'upvote' : upvoted === false ? 'downvote' : null;

  if (operation && !permissions[operation]) {
    throw new ActionNotPermittedError(`You cannot ${operation}  this post`);
  }
  await voteForumPost({
    postId,
    userId,
    upvoted
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
