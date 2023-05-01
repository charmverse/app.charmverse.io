import type { Post } from '@charmverse/core/dist/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { ListDraftPostsRequest } from 'lib/forums/posts/listDraftPosts';
import { listDraftPosts } from 'lib/forums/posts/listDraftPosts';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(requireKeys<ListDraftPostsRequest>(['spaceId'], 'query'), getDraftPosts);

async function getDraftPosts(req: NextApiRequest, res: NextApiResponse<Post[]>) {
  const userId = req.session.user.id as string;

  const posts = await listDraftPosts({
    spaceId: req.query.spaceId as string,
    userId
  });

  return res.status(200).json(posts);
}

export default withSessionRoute(handler);
