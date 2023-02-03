import type { Post } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { canEditPost } from 'lib/forums/posts/canEditPost';
import { deleteForumPost } from 'lib/forums/posts/deleteForumPost';
import { getForumPost } from 'lib/forums/posts/getForumPost';
import { updateForumPost } from 'lib/forums/posts/updateForumPost';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { computePostCategoryPermissions } from 'lib/permissions/forum/computePostCategoryPermissions';
import { computePostPermissions } from 'lib/permissions/forum/computePostPermissions';
import { requestOperations } from 'lib/permissions/requestOperations';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getForumPostController).put(updateForumPostController).delete(deleteForumPostController);

async function updateForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  await requestOperations({
    resourceType: 'post',
    operations: ['edit_post'],
    resourceId: postId,
    userId
  });
  const post = await updateForumPost(postId, req.body);

  relay.broadcast(
    {
      type: 'post_updated',
      payload: {
        id: postId,
        createdBy: post.createdBy,
        categoryId: post.categoryId
      }
    },
    post.spaceId
  );
  res.status(200).end();
}

async function deleteForumPostController(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  await requestOperations({
    resourceType: 'post',
    resourceId: postId,
    operations: ['delete_post'],
    userId
  });

  const post = await deleteForumPost(postId);

  relay.broadcast(
    {
      type: 'post_deleted',
      payload: {
        id: postId,
        categoryId: post.categoryId
      }
    },
    post.spaceId
  );

  res.status(200).end();
}

async function getForumPostController(req: NextApiRequest, res: NextApiResponse<Post>) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;

  const post = await getForumPost({ userId, postId });

  await requestOperations({
    resourceType: 'post',
    resourceId: post.id,
    operations: ['view_post'],
    userId
  });
  res.status(200).json(post);
}

export default withSessionRoute(handler);
