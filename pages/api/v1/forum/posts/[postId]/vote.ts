import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getForumPost } from 'lib/forums/posts/getForumPost';
import { requireKeys } from 'lib/middleware';
import { superApiHandler } from 'lib/public-api/handler';
import { withSessionRoute } from 'lib/session/withSession';

import { getPublicForumPost } from '../index';
import type { PublicApiForumPost } from '../index';

const handler = superApiHandler();

handler.post(requireKeys(['userId'], 'body'), voteOnPost);

/**
 * @swagger
 * /forum/posts/{postId}/vote:
 *   post:
 *     summary: Up/downvote a proposal comment
 *     description: Adds a vote for a proposal comment by a specific user
 *     tags:
 *      - 'Partner API'
 *     parameters:
 *       - name: proposalIdOrPath
 *         in: path
 *         required: true
 *         type: string
 *         description: ID or page path of the related proposal
 *       - name: postId
 *         in: path
 *         required: true
 *         type: string
 *         description: ID of the comment to create a vote for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID of the user who is performing the upvote / downvote
 *                 example: "69a54a56-50d6-4f7b-b350-2d9c312f81f3"
 *               upvoted:
 *                 type: boolean
 *                 nullable: true
 *                 description: true for an upvote, false for a downvote, null to delete the user's upvote / downvote
 *                 example: true
 *             required:
 *               - userId
 *               - upvoted
 *     responses:
 *       200:
 *         description: Comment where the vote was made with refreshed vote count
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                $ref: '#/components/schemas/ProposalComment'
 *
 */
async function voteOnPost(req: NextApiRequest, res: NextApiResponse<PublicApiForumPost>) {
  // This should never be undefined, but adding this safeguard for future proofing
  const userId = req.body.userId as string;
  const postId = req.query.postId as string;

  await prisma.post.findFirstOrThrow({
    where: {
      id: postId,
      spaceId: {
        in: req.spaceIdRange
      }
    },
    select: {
      id: true
    }
  });

  if (req.body.upvoted === null) {
    await prisma.postUpDownVote.delete({
      where: {
        createdBy_postId: {
          postId,
          createdBy: userId
        }
      }
    });
  } else {
    await prisma.postUpDownVote.upsert({
      where: {
        createdBy_postId: {
          postId,
          createdBy: userId
        }
      },
      create: {
        createdBy: userId,
        upvoted: req.body.upvoted,
        post: { connect: { id: postId } }
      },
      update: {
        upvoted: req.body.upvoted
      }
    });
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
