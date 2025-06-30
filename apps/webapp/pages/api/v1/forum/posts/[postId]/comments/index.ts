import type { PostComment } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import { parseMarkdown } from '@packages/bangleeditor/markdown/parseMarkdown';
import { InvalidInputError, UnauthorisedActionError } from '@packages/core/errors';
import { createPostComment } from '@packages/lib/forums/comments/createPostComment';
import type { PostCommentVote } from '@packages/lib/forums/comments/interface';
import { requireApiKey, requireKeys, requireSuperApiKey } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { InvalidStateError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { defaultHandler, logApiRequest } from 'lib/public-api/handler';
import type { UserProfile } from 'lib/public-api/interfaces';
import type { UserInfo } from 'lib/public-api/searchUserProfile';
import { getUserProfile, userProfileSelect } from 'lib/public-api/searchUserProfile';

const handler = defaultHandler();

handler.get(requireApiKey, logApiRequest, getPostComments);

handler.post(
  requireSuperApiKey,
  logApiRequest,
  requireKeys(['userId', 'contentMarkdown'], 'body'),
  createPostCommentEndpoint
);

/**
 * @swagger
 * components:
 *   schemas:
 *     ForumPostComment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *         author:
 *           type: object
 *           $ref: '#/components/schemas/SearchUserResponseBody'
 *         content:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *               example: "This is a comment."
 *             markdown:
 *               type: string
 *               example: "## This is a comment."
 *         createdAt:
 *           type: string
 *           description: ISO Timestamp of comment creation date
 *           example: '2023-09-20T01:37:24.262Z'
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: Parent comment
 *           example: null
 *         upvotes:
 *           type: integer
 *           example: 5
 *         downvotes:
 *           type: integer
 *           example: 2
 *         children:
 *           type: array
 *           description: Child comments of this comment. By default, this array is empty unless you request comments as a tree
 *           example: []
 *
 */
export type PublicApiPostComment = {
  id: string;
  author: UserProfile;
  createdAt: string;
  parentId: string | null;
  content: {
    text: string;
    markdown: string;
  };
  upvotes: number;
  downvotes: number;
  children: PublicApiPostComment[];
};

async function mapReducePostComments({
  comments,
  reduceToTree
}: {
  comments: (Pick<PostComment, 'id' | 'parentId' | 'content' | 'contentText' | 'createdAt'> & {
    votes: Pick<PostCommentVote, 'upvoted'>[];
    user: UserInfo;
  })[];
  reduceToTree?: boolean;
}): Promise<PublicApiPostComment[]> {
  const mappedComments: Record<string, PublicApiPostComment> = {};

  const rootComments: PublicApiPostComment[] = [];

  // Map comments to correct shape
  for (const comment of comments) {
    const { upvotes, downvotes } = comment.votes.reduce(
      (acc, val) => {
        if (val.upvoted) {
          acc.upvotes += 1;
        } else if (val.upvoted === false) {
          acc.downvotes += 1;
        }
        return acc;
      },
      { upvotes: 0, downvotes: 0 }
    );

    const parsedContent = await generateMarkdown({
      content: comment.content
    });

    const commentWithDetails: PublicApiPostComment = {
      id: comment.id,
      author: getUserProfile(comment.user),
      createdAt: comment.createdAt.toISOString(),
      parentId: comment.parentId,
      content: {
        markdown: parsedContent,
        text: comment.contentText
      },
      upvotes,
      downvotes,
      children: []
    };

    // Remove unneeded votes

    mappedComments[comment.id] = commentWithDetails;

    if (!commentWithDetails.parentId) {
      rootComments.push(commentWithDetails);
    }
  }

  const allComments = Object.values(mappedComments);

  // Early exit with default behaviour
  if (!reduceToTree) {
    return allComments;
  }

  // Iterate a second time to add children
  for (const comment of allComments) {
    if (comment.parentId && mappedComments[comment.parentId]) {
      mappedComments[comment.parentId].children.push(comment);
    }
  }

  return rootComments;
}

/**
 * @swagger
 * /forum/posts/{postId}/comments:
 *   get:
 *     summary: Get post comments
 *     description: Return comments for a post as an array (default) or a tree
 *     tags:
 *      - 'Space API'
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID or path of the database to create a card in
 *       - name: resultsAsTree
 *         in: query
 *         required: false
 *         description: Optional parameter to get the comments as a tree structure
 *         schema:
 *           type: boolean
 *       - name: expand
 *         in: query
 *         required: false
 *         description: An array of additional fields to expand
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [user]
 *     responses:
 *       200:
 *         description: List of post comments
 *         content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/ForumPostComment'
 *
 */
async function getPostComments(req: NextApiRequest, res: NextApiResponse<PublicApiPostComment[]>) {
  // This should never be undefined, but adding this safeguard for future proofing
  const spaceId = req.authorizedSpaceId;
  const postId = req.query.postId as string;

  if (!spaceId) {
    throw new InvalidStateError('Space ID is undefined');
  }

  await prisma.post.findFirstOrThrow({
    where: {
      spaceId,
      id: postId
    },
    select: {
      id: true
    }
  });

  const postComments = await prisma.postComment.findMany({
    where: {
      postId
    },
    select: {
      id: true,
      parentId: true,
      content: true,
      contentText: true,
      createdBy: true,
      createdAt: true,
      votes: {
        select: {
          upvoted: true
        }
      },
      user: {
        select: userProfileSelect
      }
    }
  });

  const mappedComments = await mapReducePostComments({
    comments: postComments,
    reduceToTree: req.query.resultsAsTree === 'true'
  });

  return res.status(200).json(mappedComments);
}

/**
 * @swagger
 * /forum/posts/{postId}/comments:
 *   post:
 *     summary: Create post comment
 *     description: Adds a new top-level comment to a post, or a response to an existing post comment
 *     tags:
 *      - 'Partner API'
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the related post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID of comment author
 *                 example: "69a54a56-50d6-4f7b-b350-2d9c312f81f3"
 *               contentMarkdown:
 *                 type: string
 *                 description: Content of the comment as a string or markdown
 *                 example: "This is a comment."
 *               parentId:
 *                 type: string
 *                 nullable: true
 *                 description: ID of the parent comment, if this is a response to an existing comment
 *                 example: "36d31192-af56-4e74-9f85-502a21032b51"
 *
 *             required:
 *               - userId
 *               - content
 *     responses:
 *       200:
 *         description: Created comment
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                $ref: '#/components/schemas/ForumPostComment'
 *
 */
async function createPostCommentEndpoint(req: NextApiRequest, res: NextApiResponse<PublicApiPostComment>) {
  // This should never be undefined, but adding this safeguard for future proofing
  if (!req.spaceIdRange) {
    throw new InvalidStateError('Space ID is undefined');
  }
  const postId = req.query.postId as string;

  const post = await prisma.post.findFirstOrThrow({
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

  const userId = req.body.userId as string;

  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId: post.spaceId,
      userId
    }
  });

  if (!spaceRole) {
    throw new UnauthorisedActionError('User does not have access to this space');
  }

  const commentContent = parseMarkdown(req.body.contentMarkdown);

  const result = await createPostComment({
    postId,
    userId,
    content: commentContent,
    contentText: req.body.contentMarkdown,
    parentId: req.body.parentId
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    include: {
      wallets: true,
      googleAccounts: true
    }
  });

  const apiComment: PublicApiPostComment = {
    id: result.id,
    createdAt: result.createdAt.toISOString(),
    content: {
      markdown: req.body.contentMarkdown,
      text: req.body.contentMarkdown
    },
    author: getUserProfile(user),
    downvotes: 0,
    upvotes: 0,
    parentId: result.parentId,
    children: []
  };

  return res.status(201).json(apiComment);
}

export default withSessionRoute(handler);
