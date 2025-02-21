import { UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getForumPost } from 'lib/forums/posts/getForumPost';
import { voteForumPost } from 'lib/forums/posts/voteForumPost';
import { requireKeys } from 'lib/middleware';
import { superApiHandler } from 'lib/public-api/handler';
import { getUserProfile, userProfileSelect } from 'lib/public-api/searchUserProfile';
import { withSessionRoute } from 'lib/session/withSession';

import { getPublicForumPost } from '../index';
import type { PublicApiForumPost } from '../index';

const handler = superApiHandler();

handler.post(requireKeys(['userId', 'upvoted'], 'body'), upvoteDownvotePost);

/**
 * @swagger
 * /forum/posts/{postId}/upvote:
 *   post:
 *     summary: Up/downvote a form post
 *     description: Upvote or downvote a forum post. If the user has already upvoted / downvoted the post, this will toggle the vote.
 *     tags:
 *      - 'Partner API'
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         type: string
 *         description: ID of the post to upvote / downvote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             $ref: '#/components/schemas/UpvoteInput'
 *     responses:
 *       200:
 *         description: Comment where the vote was made with refreshed vote count
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                $ref: '#/components/schemas/ForumPost'
 *
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UpvoteInput:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: User ID of the user who is performing the upvote / downvote
 *           example: "69a54a56-50d6-4f7b-b350-2d9c312f81f3"
 *         upvoted:
 *           type: boolean
 *           nullable: true
 *           description: true for an upvote, false for a downvote, null to delete the user's upvote / downvote
 *           example: true
 *       required:
 *         - userId
 *         - upvoted
 */

export interface UpvoteInput {
  userId: string;
  upvoted: boolean | null;
}
async function upvoteDownvotePost(req: NextApiRequest, res: NextApiResponse<PublicApiForumPost>) {
  const { userId, upvoted } = req.body as UpvoteInput;
  const postId = req.query.postId as string;

  if (!userId || !postId) {
    throw new InvalidInputError('User ID or post ID is undefined');
  }

  const proposal = await prisma.post.findFirstOrThrow({
    where: {
      id: postId,
      spaceId: {
        in: req.spaceIdRange
      }
    },
    select: {
      spaceId: true,
      id: true
    }
  });

  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId: proposal.spaceId,
      userId
    }
  });

  if (!spaceRole) {
    throw new UnauthorisedActionError('User does not have access to this space');
  }

  await voteForumPost({
    postId,
    userId,
    upvoted
  });

  const post = await getForumPost({ postId });
  const { category, space, author } = await prisma.post.findFirstOrThrow({
    where: {
      id: req.query.postId as string
    },
    select: {
      category: true,
      space: true,
      author: {
        select: userProfileSelect
      }
    }
  });
  const cleanPost = {
    ...post,
    isDraft: !!post.isDraft,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString()
  };
  const result = await getPublicForumPost({
    post: {
      ...cleanPost,
      author: getUserProfile(author)
    },
    spaceDomain: space.domain,
    categoryName: category.name
  });

  return res.status(200).json(result);
}

export default withSessionRoute(handler);
