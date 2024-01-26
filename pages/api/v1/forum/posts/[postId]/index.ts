import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getForumPost } from 'lib/forums/posts/getForumPost';
import { InvalidStateError } from 'lib/middleware';
import { apiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from 'lib/session/withSession';

import type { PublicApiForumPost } from '../index';
import { getPublicForumPost } from '../index';

const handler = apiHandler();

handler.get(getProposal);

/**
 * @swagger
 * /forum/posts/{postId}:
 *   get:
 *     summary: Get a forum post
 *     tags:
 *      - 'Space API'
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Forum post
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ForumPost'
 *
 */
async function getProposal(req: NextApiRequest, res: NextApiResponse<PublicApiForumPost>) {
  // This should never be undefined, but adding this safeguard for future proofing
  const spaceId = req.authorizedSpaceId;

  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }

  const post = await getForumPost({ postId: req.query.postId as string });
  const { category, space } = await prisma.post.findFirstOrThrow({
    where: {
      id: req.query.postId as string
    },
    select: {
      category: true,
      space: true
    }
  });
  const categoryMap = new Map([[post.categoryId, category]]);
  const cleanPost = {
    ...post,
    isDraft: !!post.isDraft,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString()
  };

  const result = await getPublicForumPost(cleanPost, categoryMap, space);

  return res.status(200).json(result);
}

export default withSessionRoute(handler);
