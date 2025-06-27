import { prisma } from '@charmverse/core/prisma-client';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import { parseMarkdown } from '@packages/bangleeditor/markdown/parseMarkdown';
import { UnauthorisedActionError } from '@packages/core/errors';
import { createForumPost, trackCreateForumPostEvent } from '@packages/lib/forums/posts/createForumPost';
import { getPostVoteSummary, type ForumPostMeta } from '@packages/lib/forums/posts/getPostMeta';
import { listForumPosts } from '@packages/lib/forums/posts/listForumPosts';
import { requireKeys } from '@packages/lib/middleware';
import { requireSuperApiKey } from '@packages/lib/middleware/requireSuperApiKey';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { InvalidStateError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { apiHandler } from 'lib/public-api/handler';
import type { UserProfile } from 'lib/public-api/interfaces';
import type { UserInfo } from 'lib/public-api/searchUserProfile';
import { getUserProfile, userProfileSelect } from 'lib/public-api/searchUserProfile';

const handler = apiHandler();

handler.get(listPosts);

handler.post(requireSuperApiKey, requireKeys(['userId', 'contentMarkdown', 'title', 'categoryId'], 'body'), createPost);

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
 *        comments:
 *          type: number
 *          optional: true
 *        upvotes:
 *          type: number
 *        downvotes:
 *          type: number
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
  comments: number;
  upvotes: number;
  downvotes: number;
};

/**
 * @swagger
 * components:
 *  schemas:
 *    CreateForumPostInput:
 *      type: object
 *      properties:
 *        userId:
 *          type: string
 *          format: uuid
 *        contentMarkdown:
 *          type: string
 *          description: Markdown content of the forum post
 *        title:
 *          type: string
 *          description: Title of the forum post
 *        categoryId:
 *          type: string
 *          format: uuid
 *      required:
 *        - userId
 *        - contentMarkdown
 *        - title
 */

interface CreateForumPostInput {
  userId: string;
  contentMarkdown: string;
  title: string;
  categoryId?: string;
}

/**
 * @swagger
 * /forum/posts:
 *   post:
 *     summary: Create a new forum post
 *     tags:
 *      - 'Partner API'
 *     requestBody:
 *        description: Forum post to create
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/CreateForumPostInput'
 *     responses:
 *       200:
 *         description: Created forum post
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                $ref: '#/components/schemas/ForumPost'
 */

async function createPost(req: NextApiRequest, res: NextApiResponse<PublicApiForumPost>) {
  // This should never be undefined, but adding this safeguard for future proofing
  const spaceId = req.authorizedSpaceId;
  const payload = req.body as CreateForumPostInput;

  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      id: true,
      domain: true
    }
  });

  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId: space.id,
      userId: payload.userId
    }
  });

  if (!spaceRole) {
    throw new UnauthorisedActionError('User does not have access to this space');
  }

  const postContent = parseMarkdown(payload.contentMarkdown);

  let categoryId = payload.categoryId;
  if (!categoryId) {
    const categories = await prisma.postCategory.findMany({
      where: {
        spaceId: space.id
      }
    });
    const generalCategory = categories.find((c) => c.name === 'General');
    categoryId = generalCategory?.id || categories[0].id;
  }

  const createdFormPost = await createForumPost({
    categoryId: categoryId as string,
    content: postContent,
    contentText: payload.contentMarkdown,
    createdBy: payload.userId,
    isDraft: false,
    spaceId: space.id,
    title: payload.title
  });

  await trackCreateForumPostEvent({
    post: createdFormPost,
    userId: payload.userId
  });

  const { upDownVotes, ...post } = await prisma.post.findFirstOrThrow({
    where: {
      id: createdFormPost.id
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
      votes: getPostVoteSummary(upDownVotes, payload.userId),
      author: getUserProfile(post.author),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      isDraft: false
    },
    spaceDomain: space.domain,
    categoryName: post.category.name
  });

  return res.status(200).json(forumPost);
}
/**
 * @swagger
 * /forum/posts:
 *   get:
 *     summary: Get forum posts
 *     tags:
 *      - 'Space API'
 *     parameters:
 *      - name: categoryId
 *        in: query
 *        description: ID of the post category to filter by
 *        schema:
 *          type: string
 *          format: uuid
 *      - name: page
 *        in: query
 *        description: results page to query
 *        schema:
 *          type: number
 *      - name: count
 *        in: query
 *        description: results per request. 5 is default, 100 is max
 *        schema:
 *          type: number
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
  const count = req.query.count ? parseInt(req.query.count as string) : undefined;
  const page = req.query.page ? parseInt(req.query.page as string) : undefined;
  const categoryId = req.query.categoryId as string | undefined;
  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }

  if (count && (count < 1 || count > 100)) {
    throw new InvalidStateError('Count must be between 1 and 100');
  }

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      id: true,
      domain: true
    }
  });

  const { data, cursor: nextPage } = await listForumPosts({
    spaceId: space.id,
    sort: 'new',
    authorSelect: userProfileSelect,
    page,
    count,
    categoryId
  });

  const posts = data as (ForumPostMeta & { totalComments: number; author: UserInfo })[];

  const categories = await prisma.postCategory.findMany({
    where: {
      spaceId: space.id
    }
  });
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const mappedPosts: PublicApiForumPost[] = await Promise.all(
    posts.map((post) => {
      return getPublicForumPost({
        post: {
          ...post,
          author: getUserProfile(post.author)
        },
        spaceDomain: space.domain,
        categoryName: categoryMap.get(post.categoryId)?.name
      });
    })
  );

  return res.status(200).json({ posts: mappedPosts, nextPage: nextPage || undefined });
}

export async function getPublicForumPost({
  categoryName,
  post,
  spaceDomain
}: {
  post: Omit<ForumPostMeta, 'summary'> & { totalComments?: number; author: UserProfile };
  spaceDomain: string;
  categoryName?: string;
}): Promise<PublicApiForumPost> {
  let markdownText: string;
  try {
    markdownText = await generateMarkdown({
      content: post.content
    });
  } catch (err) {
    markdownText = 'markdown not available';
  }
  return {
    author: post.author,
    id: post.id,
    createdAt: post.createdAt,
    url: `${process.env.DOMAIN}/${spaceDomain}/forum/posts/${post.path}`,
    title: post.title,
    category: {
      id: post.categoryId,
      name: categoryName ?? ''
    },
    content: {
      text: post.contentText ?? '',
      markdown: markdownText
    },
    comments: post.totalComments || 0,
    upvotes: post.votes.upvotes,
    downvotes: post.votes.downvotes
  };
}

export default withSessionRoute(handler);
