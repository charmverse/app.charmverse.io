import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import { generateBoard, generateBountyWithSingleApplication } from 'testing/setupDatabase';
import { stubProsemirrorDoc } from 'testing/stubs/pageContent';

import type { CommentBlocksCount } from '../countCommentBlocks';
import { countCommentBlocks } from '../countCommentBlocks';

describe('countCommentBlocks', () => {
  it('should count comments across different entities', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    // Generate post comments
    const post = await testUtilsForum.generateForumPost({
      userId: user.id,
      spaceId: space.id,
      content: {}, // Assuming the content structure is irrelevant for this test
      contentText: 'Example text'
    });

    const postComments = await prisma.postComment.createMany({
      data: [
        { content: {}, contentText: 'Example text', createdBy: user.id, postId: post.id },
        { content: {}, contentText: 'Example text', createdBy: user.id, postId: post.id },
        { content: {}, contentText: 'Example text', createdBy: user.id, postId: post.id },
        { content: {}, contentText: 'Example text', createdBy: user.id, postId: post.id }
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
          content: {}, // Assuming the content structure is irrelevant for this test,
          contentText: 'Example text',
          createdBy: user.id
        },
        {
          applicationId: reward.applications[0].id,
          content: {}, // Assuming the content structure is irrelevant for this test,
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
          content: {}, // Assuming the content structure is irrelevant for this test,
          contentText: 'Example text',
          createdBy: user.id,
          pageId: proposal.id
        },
        {
          content: {}, // Assuming the content structure is irrelevant for this test,
          contentText: 'Example text',
          createdBy: user.id,
          pageId: proposal.id
        },
        {
          content: {}, // Assuming the content structure is irrelevant for this test,
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

    const counts = await countCommentBlocks({ spaceId: space.id, batchSize: 2 });

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
});
