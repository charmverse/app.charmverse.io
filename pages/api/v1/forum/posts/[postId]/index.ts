import { prisma } from '@charmverse/core/prisma-client';
import { InvalidStateError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getForumPost } from 'lib/forums/posts/getForumPost';
import { getPostVoteSummary } from 'lib/forums/posts/getPostMeta';
import { updateForumPost } from 'lib/forums/posts/updateForumPost';
import { requireSuperApiKey } from 'lib/middleware/requireSuperApiKey';
import { parseMarkdown } from 'lib/prosemirror/markdown/parseMarkdown';
import { apiHandler } from 'lib/public-api/handler';
import { getUserProfile, userProfileSelect } from 'lib/public-api/searchUserProfile';
import { withSessionRoute } from 'lib/session/withSession';

import type { PublicApiForumPost } from '../index';
import { getPublicForumPost } from '../index';

const handler = apiHandler().get(getPost).use(requireSuperApiKey).put(updatePost).delete(deleteProposal);

type EmptySuccessResponse = { success: true };

/**
 * @swagger
 * components:
 *  schemas:
 *    UpdateForumPostInput:
 *      type: object
 *      properties:
 *        contentMarkdown:
 *          type: string
 *          description: Markdown content of the forum post
 *          optional: true
 *        title:
 *          type: string
 *          description: Title of the forum post
 *          optional: true
 *        categoryId:
 *          type: string
 *          format: uuid
 *          optional: true
 */

interface UpdateForumPostInput {
  contentMarkdown?: string;
  title?: string;
  categoryId?: string;
}

/**
 * @swagger
 * /forum/posts/{postId}:
 *   put:
 *     summary: Update a forum post
 *     tags:
 *      - 'Partner API'
 *     parameters:
 *      - name: postId
 *        in: path
 *        required: true
 *        schema:
 *          type: string
 *     requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/UpdateForumPostInput'
 *     responses:
 *       200:
 *         description: Updated forum post
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                $ref: '#/components/schemas/ForumPost'
 */

async function updatePost(req: NextApiRequest, res: NextApiResponse<PublicApiForumPost>) {
  const spaceId = req.authorizedSpaceId;
  const payload = req.body as UpdateForumPostInput;
  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }
  const postId = req.query.postId as string;

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      id: true,
      domain: true
    }
  });

  const postContent = parseMarkdown(payload.contentMarkdown ?? '');

  const updatedFormPost = await updateForumPost(postId, {
    categoryId: payload.categoryId,
    content: postContent,
    contentText: payload.contentMarkdown,
    isDraft: false,
    title: payload.title
  });

  const { upDownVotes, ...post } = await prisma.post.findFirstOrThrow({
    where: {
      id: updatedFormPost.id
    },
    include: {
      upDownVotes: {
        select: {
          upvoted: true,
          createdBy: true
        }
      },
      category: {
        select: {
          name: true
        }
      },
      author: {
        select: userProfileSelect
      }
    }
  });

  const forumPost = await getPublicForumPost({
    post: {
      ...post,
      votes: getPostVoteSummary(upDownVotes, post.author.id),
      author: getUserProfile(post.author),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      isDraft: !!post.isDraft
    },
    spaceDomain: space.domain,
    categoryName: post.category.name
  });

  return res.status(200).json(forumPost);
}

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
async function getPost(req: NextApiRequest, res: NextApiResponse<PublicApiForumPost>) {
  // This should never be undefined, but adding this safeguard for future proofing
  const spaceId = req.authorizedSpaceId;

  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }

  const post = await getForumPost({ postId: req.query.postId as string });
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

/**
 * @swagger
 * /forum/posts/{postId}:
 *   delete:
 *     summary: Delete a forum post
 *     tags:
 *      - 'Partner API'
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *
 */
async function deleteProposal(req: NextApiRequest, res: NextApiResponse<EmptySuccessResponse>) {
  // This should never be undefined, but adding this safeguard for future proofing
  const spaceId = req.authorizedSpaceId;

  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }
  const postId = req.query.postId;
  if (typeof postId !== 'string') {
    throw new InvalidStateError('Post ID is undefined');
  }

  await prisma.post.delete({
    where: {
      id: postId
    },
    select: {
      category: true,
      space: true,
      author: {
        select: userProfileSelect
      }
    }
  });

  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
