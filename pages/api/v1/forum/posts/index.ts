import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import type { ForumPostMeta } from 'lib/forums/posts/getPostMeta';
import { listForumPosts } from 'lib/forums/posts/listForumPosts';
import { InvalidStateError } from 'lib/middleware';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';
import { apiHandler } from 'lib/public-api/handler';
import type { UserProfile } from 'lib/public-api/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = apiHandler();

/**
 * @swagger
 * components:
 *  schemas:
 *    ForumPost:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *        createdAt:
 *          type: string
 *          format: date-time
 *        content:
 *          type: object
 *          properties:
 *            text:
 *              type: string
 *            markdown:
 *              type: string
 *        author:
 *          type: object
 *          $ref: '#/components/schemas/UserProfile'
 *        title:
 *          type: string
 *        url:
 *          type: string
 *          example: https://app.charmverse.io/<your-domain>/forum/post/<post-path>
 *        category:
 *          type: object
 *          properties:
 *            id:
 *              type: string
 *              format: uuid
 *            name:
 *              type: string
 *        totalComments:
 *          type: number
 *        votes:
 *          type: object
 *          properties:
 *            upvotes:
 *              type: number
 *            downvotes:
 *              type: number
 *
 */
export type PublicApiForumPost = {
  id: string;
  author: UserProfile;
  createdAt: string;
  category: {
    id: string;
    name: string;
  };
  content: {
    text: string;
    markdown: string;
  };
  title: string;
  url: string;
  comments?: number;
  upvotes: number;
  downvotes: number;
};

handler.get(listPosts);
/**
 * @swagger
 * /proposals:
 *   get:
 *     summary: Get forum posts
 *     tags:
 *      - 'Space API'
 *     responses:
 *       200:
 *         description: List of forum posts
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  nextPage:
 *                    type: number
 *                  posts:
 *                    type: array
 *                    items:
 *                      type: object
 *                      $ref: '#/components/schemas/ForumPost'
 */
async function listPosts(
  req: NextApiRequest,
  res: NextApiResponse<{ posts: PublicApiForumPost[]; nextPage?: number }>
) {
  // This should never be undefined, but adding this safeguard for future proofing
  const spaceId = req.authorizedSpaceId;

  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    }
  });

  const { data: posts, cursor: nextPage } = await listForumPosts({
    spaceId: space.id,
    sort: 'new'
  });

  const categories = await prisma.postCategory.findMany({
    where: {
      spaceId: space.id
    }
  });
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const mappedPosts: PublicApiForumPost[] = await Promise.all(
    posts.map((post, index) => {
      return getPublicForumPost(post, categoryMap, space);
    })
  );

  return res.status(200).json({ posts: mappedPosts, nextPage: nextPage || undefined });
}

export async function getPublicForumPost(
  post: Omit<ForumPostMeta, 'summary'> & { totalComments?: number },
  categoryMap: Map<string, { name: string }>,
  space: { domain: string }
): Promise<PublicApiForumPost> {
  let markdownText: string;
  try {
    markdownText = await generateMarkdown({
      content: post.content
    });
  } catch (err) {
    markdownText = 'markdown not available';
  }
  return {
    id: post.id,
    createdAt: post.createdAt,
    url: `${process.env.DOMAIN}/${space.domain}/forum/posts/${post.path}`,
    title: post.title,
    category: {
      id: post.categoryId,
      name: categoryMap.get(post.categoryId)?.name ?? ''
    },
    content: {
      text: post.contentText ?? '',
      markdown: markdownText
    },
    comments: post.totalComments,
    upvotes: post.votes.upvotes,
    downvotes: post.votes.downvotes
  };
}

export default withSessionRoute(handler);
