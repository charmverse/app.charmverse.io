import { prisma } from '@charmverse/core/prisma-client';
import type { Space, User } from 'prisma';

import { InvalidInputError } from '../../errors';
import { generateCommentWithThreadAndPage, generatePage } from '../pages';
import { generateUserAndSpace } from '../user';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({});
  space = generated.space;
  user = generated.user;
});

const commentText = 'Example text';

const commentContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: commentText
        }
      ]
    }
  ]
};

describe('generateCommentWithThreadAndPage', () => {
  it('should generate a page, comment and thread, with specific comment content if provided', async () => {
    const { comment, page, thread } = await generateCommentWithThreadAndPage({
      commentContent,
      spaceId: space.id,
      userId: user.id
    });

    expect(page.type).toBe('page');
    expect(thread.pageId).toBe(page.id);
    expect(comment.pageId).toBe(page.id);
    expect(comment.threadId).toBe(thread.id);

    expect(JSON.stringify(comment.content)).toMatch(commentText);
  });

  it('should link to an existing page if it is provided', async () => {
    const page = await generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const {
      comment,
      page: pageFromGenerator,
      thread
    } = await generateCommentWithThreadAndPage({
      commentContent,
      spaceId: space.id,
      userId: user.id,
      pageId: page.id
    });

    expect(pageFromGenerator.id).toBe(page.id);

    expect(thread.pageId).toBe(page.id);
    expect(comment.pageId).toBe(page.id);
    expect(comment.threadId).toBe(thread.id);
  });

  it('should link to an existing thread if it is provided', async () => {
    const page = await generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const thread = await prisma.thread.create({
      data: {
        context: 'any',
        resolved: false,
        page: { connect: { id: page.id } },
        space: { connect: { id: space.id } },
        user: { connect: { id: user.id } }
      }
    });

    const {
      comment,
      page: pageFromGenerator,
      thread: threadFromGenerator
    } = await generateCommentWithThreadAndPage({
      commentContent,
      spaceId: space.id,
      userId: user.id,
      pageId: page.id,
      threadId: thread.id
    });

    expect(pageFromGenerator.id).toBe(page.id);
    expect(threadFromGenerator.id).toBe(thread.id);

    expect(thread.pageId).toBe(page.id);
    expect(comment.pageId).toBe(page.id);
    expect(comment.threadId).toBe(thread.id);
  });

  it('should throw an error if pageId and threadId are provided but the thread does not belong to the page', async () => {
    const page = await generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const threadPage = await generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const thread = await prisma.thread.create({
      data: {
        context: 'any',
        resolved: false,
        page: { connect: { id: threadPage.id } },
        space: { connect: { id: space.id } },
        user: { connect: { id: user.id } }
      }
    });

    await expect(
      generateCommentWithThreadAndPage({
        commentContent,
        spaceId: space.id,
        userId: user.id,
        pageId: page.id,
        threadId: thread.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
