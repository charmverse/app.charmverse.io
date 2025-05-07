import { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsPages, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateBoard, generateBountyWithSingleApplication } from '@packages/testing/setupDatabase';
import { stubProsemirrorDoc } from '@packages/testing/stubs/pageContent';
import { v4 as uuid } from 'uuid';

import type { CommentBlocksCount } from '../countCommentBlocks';
import { countCommentBlocks } from '../countCommentBlocks';

describe('countCommentBlocks', () => {
  it('should count comments across different entities', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    // Generate post comments
    const post = await testUtilsForum.generateForumPost({
      userId: user.id,
      spaceId: space.id,
      contentText: 'Example text'
    });

    const postComments = await prisma.postComment.createMany({
      data: [
        { content: Prisma.JsonNull, contentText: 'Example text', createdBy: user.id, postId: post.id },
        { content: Prisma.JsonNull, contentText: 'Example text', createdBy: user.id, postId: post.id },
        { content: Prisma.JsonNull, contentText: 'Example text', createdBy: user.id, postId: post.id },
        { content: Prisma.JsonNull, contentText: 'Example text', createdBy: user.id, postId: post.id }
      ]
    });

    // Generate application comments
    const reward = await generateBountyWithSingleApplication({
      applicationStatus: 'inProgress',
      bountyCap: null,
      spaceId: space.id,
      userId: user.id
    });

    await prisma.applicationComment.createMany({
      data: [
        {
          applicationId: reward.applications[0].id,
          content: Prisma.JsonNull, // Assuming the content structure is irrelevant for this test,
          contentText: 'Example text',
          createdBy: user.id
        },
        {
          applicationId: reward.applications[0].id,
          content: Prisma.JsonNull, // Assuming the content structure is irrelevant for this test,
          contentText: 'Example text',
          createdBy: user.id
        }
      ]
    });

    // Generate page comments
    const proposal = await testUtilsProposals.generateProposal({ spaceId: space.id, userId: user.id });

    await prisma.pageComment.createMany({
      data: [
        {
          content: Prisma.JsonNull, // Assuming the content structure is irrelevant for this test,
          contentText: 'Example text',
          createdBy: user.id,
          pageId: proposal.id
        },
        {
          content: Prisma.JsonNull, // Assuming the content structure is irrelevant for this test,
          contentText: 'Example text',
          createdBy: user.id,
          pageId: proposal.id
        },
        {
          content: Prisma.JsonNull, // Assuming the content structure is irrelevant for this test,
          contentText: 'Example text',
          createdBy: user.id,
          pageId: proposal.id
        }
      ]
    });

    // Generate inline comments
    const inlineThread = await prisma.thread.create({
      data: {
        context: 'uid marker in prosemirror doc',
        resolved: false,
        page: { connect: { id: proposal.id } },
        space: { connect: { id: space.id } },
        user: { connect: { id: user.id } }
      }
    });

    await prisma.comment.createMany({
      data: [
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          threadId: inlineThread.id,
          userId: user.id,
          pageId: proposal.id,
          spaceId: space.id
        },
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          threadId: inlineThread.id,
          userId: user.id,
          pageId: proposal.id,
          spaceId: space.id
        },
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          threadId: inlineThread.id,
          userId: user.id,
          pageId: proposal.id,
          spaceId: space.id
        },
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          threadId: inlineThread.id,
          userId: user.id,
          pageId: proposal.id,
          spaceId: space.id
        },
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          threadId: inlineThread.id,
          userId: user.id,
          pageId: proposal.id,
          spaceId: space.id
        }
      ]
    });

    const database = await generateBoard({ createdBy: user.id, spaceId: space.id });

    const blockComments = await prisma.block.createMany({
      data: [
        {
          createdBy: user.id,
          parentId: database.id,
          rootId: database.id,
          fields: {},
          spaceId: space.id,
          title: ' ',
          schema: 1,
          type: 'comment',
          updatedBy: user.id,
          id: uuid()
        },
        {
          createdBy: user.id,
          parentId: database.id,
          rootId: database.id,
          fields: {},
          spaceId: space.id,
          title: ' ',
          schema: 1,
          type: 'comment',
          updatedBy: user.id,
          id: uuid()
        },
        {
          createdBy: user.id,
          parentId: database.id,
          rootId: database.id,
          fields: {},
          spaceId: space.id,
          title: ' ',
          schema: 1,
          type: 'comment',
          updatedBy: user.id,
          id: uuid()
        },
        {
          createdBy: user.id,
          parentId: database.id,
          rootId: database.id,
          fields: {},
          spaceId: space.id,
          title: ' ',
          schema: 1,
          type: 'comment',
          updatedBy: user.id,
          id: uuid()
        },
        {
          createdBy: user.id,
          parentId: database.id,
          rootId: database.id,
          fields: {},
          spaceId: space.id,
          title: ' ',
          schema: 1,
          type: 'comment',
          updatedBy: user.id,
          id: uuid()
        },
        {
          createdBy: user.id,
          parentId: database.id,
          rootId: database.id,
          fields: {},
          spaceId: space.id,
          title: ' ',
          schema: 1,
          type: 'comment',
          updatedBy: user.id,
          id: uuid()
        }
      ]
    });

    const counts = await countCommentBlocks({ spaceId: space.id, batchSize: 10 });

    // Modify the expected counts based on the generated comments
    expect(counts).toMatchObject<CommentBlocksCount>({
      total: 20,
      details: {
        applicationComment: 2,
        blockComment: 6,
        comment: 5,
        pageComments: 3,
        postComment: 4
      }
    });
  });

  it('should ignore application comments if they are marked as deleted, or if the page for the linked reward is marked as deleted', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    // Generate application comments

    const deletedReward = await generateBountyWithSingleApplication({
      applicationStatus: 'inProgress',
      bountyCap: null,
      spaceId: space.id,
      userId: user.id,
      deletedAt: new Date()
    });

    await prisma.applicationComment.createMany({
      data: [
        {
          applicationId: deletedReward.applications[0].id,
          content: Prisma.JsonNull, // Assuming the content structure is irrelevant for this test,
          contentText: 'Example text',
          createdBy: user.id
        },
        {
          applicationId: deletedReward.applications[0].id,
          content: Prisma.JsonNull, // Assuming the content structure is irrelevant for this test,
          contentText: 'Example text',
          createdBy: user.id
        }
      ]
    });

    const reward = await generateBountyWithSingleApplication({
      applicationStatus: 'inProgress',
      bountyCap: null,
      spaceId: space.id,
      userId: user.id
    });

    await prisma.applicationComment.createMany({
      data: [
        {
          applicationId: reward.applications[0].id,
          content: Prisma.JsonNull, // Assuming the content structure is irrelevant for this test,
          contentText: 'Example text',
          createdBy: user.id,
          deletedAt: new Date()
        },
        {
          applicationId: reward.applications[0].id,
          content: Prisma.JsonNull, // Assuming the content structure is irrelevant for this test,
          contentText: 'Example text',
          createdBy: user.id
        }
      ]
    });
    const counts = await countCommentBlocks({ spaceId: space.id, batchSize: 10 });

    // Modify the expected counts based on the generated comments
    expect(counts).toMatchObject<CommentBlocksCount>({
      total: 1,
      details: {
        applicationComment: 1,
        blockComment: 0,
        comment: 0,
        pageComments: 0,
        postComment: 0
      }
    });
  });

  it('should ignore block comments if they are marked as deleted, or if the linked block is marked as deleted', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    // Generate application commconst database = await generateBoard({ createdBy: user.id, spaceId: space.id });

    const deletedDatabase = await generateBoard({ createdBy: user.id, spaceId: space.id, deletedAt: new Date() });

    const ignoredBlockComments = await prisma.block.createMany({
      data: [
        {
          createdBy: user.id,
          parentId: deletedDatabase.id,
          rootId: deletedDatabase.id,
          fields: {},
          spaceId: space.id,
          title: 'Ignored 1',
          schema: 1,
          type: 'comment',
          updatedBy: user.id,
          id: uuid()
        },
        {
          createdBy: user.id,
          parentId: deletedDatabase.id,
          rootId: deletedDatabase.id,
          fields: {},
          spaceId: space.id,
          title: 'Ignored 2',
          schema: 1,
          type: 'comment',
          updatedBy: user.id,
          id: uuid()
        }
      ]
    });
    const database = await generateBoard({ createdBy: user.id, spaceId: space.id });

    const blockComments = await prisma.block.createMany({
      data: [
        {
          createdBy: user.id,
          parentId: database.id,
          rootId: database.id,
          fields: {},
          spaceId: space.id,
          title: 'Included',
          schema: 1,
          type: 'comment',
          updatedBy: user.id,
          id: uuid()
        },
        {
          createdBy: user.id,
          deletedAt: new Date(),
          parentId: database.id,
          rootId: database.id,
          fields: {},
          spaceId: space.id,
          title: 'Ignored 3',
          schema: 1,
          type: 'comment',
          updatedBy: user.id,
          id: uuid()
        }
      ]
    });

    const counts = await countCommentBlocks({
      spaceId: space.id
    });

    // Modify the expected counts based on the generated comments
    expect(counts).toMatchObject<CommentBlocksCount>({
      total: 1,
      details: {
        applicationComment: 0,
        blockComment: 1,
        comment: 0,
        pageComments: 0,
        postComment: 0
      }
    });
  });

  it('should ignore page comments if the page is marked as deleted or if the comment is marked as deleted', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const deletedPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      deletedAt: new Date()
    });

    await prisma.pageComment.createMany({
      data: [
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          createdBy: user.id,
          pageId: deletedPage.id,
          contentText: ''
        },
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          createdBy: user.id,
          pageId: deletedPage.id,
          contentText: ''
        }
      ]
    });

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    await prisma.pageComment.createMany({
      data: [
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          createdBy: user.id,
          pageId: page.id,
          contentText: ''
        },
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          createdBy: user.id,
          pageId: page.id,
          contentText: '',
          deletedAt: new Date()
        }
      ]
    });

    const counts = await countCommentBlocks({
      spaceId: space.id
    });

    // Modify the expected counts based on the generated comments
    expect(counts).toMatchObject<CommentBlocksCount>({
      total: 1,
      details: {
        applicationComment: 0,
        blockComment: 0,
        comment: 0,
        pageComments: 1,
        postComment: 0
      }
    });
  });

  it('should ignore inline comments if the page is marked as deleted', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const deletedPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      deletedAt: new Date()
    });

    const deletedPageInlineThread = await prisma.thread.create({
      data: {
        context: 'uid marker in prosemirror doc',
        resolved: false,
        page: { connect: { id: deletedPage.id } },
        space: { connect: { id: space.id } },
        user: { connect: { id: user.id } }
      }
    });

    await prisma.comment.createMany({
      data: [
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          threadId: deletedPageInlineThread.id,
          userId: user.id,
          pageId: deletedPage.id,
          spaceId: space.id
        },
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          threadId: deletedPageInlineThread.id,
          userId: user.id,
          pageId: deletedPage.id,
          spaceId: space.id
        },
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          threadId: deletedPageInlineThread.id,
          userId: user.id,
          pageId: deletedPage.id,
          spaceId: space.id
        }
      ]
    });

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const inlineThread = await prisma.thread.create({
      data: {
        context: 'uid marker in prosemirror doc',
        resolved: false,
        page: { connect: { id: page.id } },
        space: { connect: { id: space.id } },
        user: { connect: { id: user.id } }
      }
    });

    await prisma.comment.createMany({
      data: [
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          threadId: inlineThread.id,
          userId: user.id,
          pageId: page.id,
          spaceId: space.id
        }
      ]
    });

    const counts = await countCommentBlocks({
      spaceId: space.id
    });

    // Modify the expected counts based on the generated comments
    expect(counts).toMatchObject<CommentBlocksCount>({
      total: 1,
      details: {
        applicationComment: 0,
        blockComment: 0,
        comment: 1,
        pageComments: 0,
        postComment: 0
      }
    });
  });

  it('should ignore post comments if the post is marked as deleted or the comment is marked as deleted', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const postCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id
    });

    const deletedPost = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      userId: user.id,
      categoryId: postCategory.id,
      deletedAt: new Date()
    });

    const deletedPostComments = await prisma.postComment.createMany({
      data: [
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          contentText: '',
          createdBy: user.id,
          postId: deletedPost.id
        },
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          contentText: '',
          createdBy: user.id,
          postId: deletedPost.id
        }
      ]
    });

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      userId: user.id,
      categoryId: postCategory.id
    });

    const postComments = await prisma.postComment.createMany({
      data: [
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          contentText: '',
          createdBy: user.id,
          postId: post.id,
          deletedAt: new Date()
        },
        {
          content: stubProsemirrorDoc({ text: 'Example text' }),
          contentText: '',
          createdBy: user.id,
          postId: post.id
        }
      ]
    });
    const counts = await countCommentBlocks({
      spaceId: space.id
    });

    // Modify the expected counts based on the generated comments
    expect(counts).toMatchObject<CommentBlocksCount>({
      total: 1,
      details: {
        applicationComment: 0,
        blockComment: 0,
        comment: 0,
        pageComments: 0,
        postComment: 1
      }
    });
  });
});
