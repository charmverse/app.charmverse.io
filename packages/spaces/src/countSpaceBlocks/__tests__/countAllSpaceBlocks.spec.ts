import type { Block, BlockCount } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsBounties, testUtilsForum, testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { emptyDocument } from '@packages/charmeditor/constants';
import { generateSchema } from '@packages/testing/publicApi/schemas';
import { generateBoard } from '@packages/testing/setupDatabase';

import type { OverallBlocksCount } from '../countAllSpaceBlocks';
import { countSpaceBlocks, countSpaceBlocksAndSave } from '../countAllSpaceBlocks';
import type { DatabaseBlocksCount } from '../countDatabaseBlockContentAndProps';
import type { MemberPropertyCounts } from '../countMemberProperties';
import type { PageCounts } from '../countSpacePages';

const pageContent = {
  ...emptyDocument,
  content: [
    {
      type: 'paragraph',
      content: [
        {
          text: 'Source: ',
          type: 'text'
        },
        {
          text: 'Wikipedia.com',
          type: 'text',
          marks: [
            {
              type: 'link',
              attrs: {
                href: 'https://en.wikipedia.org/wiki/Bitcoin'
              }
            }
          ]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        {
          text: 'Source: ',
          type: 'text'
        },
        {
          text: 'Wikipedia.com',
          type: 'text',
          marks: [
            {
              type: 'link',
              attrs: {
                href: 'https://en.wikipedia.org/wiki/Bitcoin'
              }
            }
          ]
        }
      ]
    }
  ]
};

// Count blocks in a space
describe('countSpaceBlocks - count blocks', () => {
  it('should count each database, database view and database card / row as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const selectSchema = generateSchema({ type: 'select', options: ['Blue', 'Green', 'Red'] });
    const multiSelectSchema = generateSchema({ type: 'multiSelect', options: ['Blue', 'Green', 'Red'] });
    const numberSchema = generateSchema({ type: 'number' });
    const textSchema = generateSchema({ type: 'text' });
    const dateSchema = generateSchema({ type: 'date' });
    const checkboxSchema = generateSchema({ type: 'checkbox' });
    const urlSchema = generateSchema({ type: 'url' });

    const board = await generateBoard({
      spaceId: space.id,
      createdBy: user.id,
      cardCount: 2,
      views: 2,
      customProps: {
        cardPropertyValues: {
          [selectSchema.id]: 'Blue'
        },
        propertyTemplates: [
          selectSchema,
          multiSelectSchema,
          numberSchema,
          textSchema,
          dateSchema,
          checkboxSchema,
          urlSchema
        ]
      }
    });

    const { details, total } = await countSpaceBlocks({ spaceId: space.id });
    expect(details.databaseProperties).toMatchObject<DatabaseBlocksCount>({
      total: 11,
      details: {
        databaseDescriptions: 0,
        databaseProperties: 7,
        databaseViews: 2,
        databaseRowPropValues: 2
      }
    });

    expect(details.pages).toMatchObject<PageCounts>({
      total: 3,
      details: {
        cards: 2,
        databases: 1,
        documents: 0,
        proposals: 0,
        rewards: 0
      }
    });

    expect(total).toEqual(14);
  });

  it('should count each document page as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      content: null
    });

    const page2 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      content: null
    });

    const { details, total } = await countSpaceBlocks({ spaceId: space.id });

    expect(details.pages.total).toBe(2);
    // Empty documents with no nodes to count
    expect(details.editorContent).toBe(0);

    expect(total).toEqual(2);
  });
  it('should count each page comment and inline comment as 1 block, excluding deleted comments', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      content: null
    });

    const { comment: threadComment } = await testUtilsPages.generateCommentWithThreadAndPage({
      commentContent: pageContent,
      spaceId: space.id,
      userId: user.id,
      pageId: page.id
    });

    const pageComment = await prisma.pageComment.create({
      data: {
        content: pageContent,
        contentText: '',
        page: { connect: { id: page.id } },
        user: { connect: { id: user.id } }
      }
    });

    const deletedPageComment = await prisma.pageComment.create({
      data: {
        deletedAt: new Date(),
        content: pageContent,
        contentText: '',
        page: { connect: { id: page.id } },
        user: { connect: { id: user.id } }
      }
    });

    const { total, details } = await countSpaceBlocks({ spaceId: space.id });

    expect(details.pages.total).toBe(1);
    expect(details.comments.total).toBe(2);
    // Empty documents with no nodes to count
    expect(details.editorContent).toBe(0);

    expect(total).toEqual(3);
  });

  it('should count each forum post and forum post category as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const postCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id
    });

    const posts = await testUtilsForum.generateForumPosts({
      count: 3,
      createdBy: user.id,
      spaceId: space.id,
      categoryId: postCategory.id,
      // Empty content
      content: null
    });

    const { total, details } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(details.forum.details.categories).toBe(1);
    expect(details.forum.details.posts).toBe(3);

    expect(total).toBe(4);
  });

  it('should count each forum post comment as 1 block, exluding deleted comments', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const postCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id
    });

    const post = await testUtilsForum.generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: postCategory.id,
      // Empty content
      content: null
    });

    const totalComments = 3;

    for (let i = 0; i < totalComments; i++) {
      await testUtilsForum.generatePostComment({
        content: pageContent,
        postId: post.id,
        userId: user.id
      });
    }

    await testUtilsForum.generatePostComment({
      content: pageContent,
      postId: post.id,
      userId: user.id,
      deletedAt: new Date()
    });

    const { total, details } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(details.comments.details.postComment).toBe(totalComments);
    expect(details.forum.details.categories).toBe(1);
    expect(details.forum.details.posts).toBe(1);

    expect(total).toBe(2 + totalComments);
  });

  it('should count each member property and member property value as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const props = await Promise.all([
      prisma.memberProperty.create({
        data: {
          createdBy: space.createdBy,
          name: 'Test prop 1',
          spaceId: space.id,
          type: 'text',
          updatedBy: space.createdBy
        }
      }),
      prisma.memberProperty.create({
        data: {
          createdBy: space.createdBy,
          name: 'Test prop 1',
          spaceId: space.id,
          type: 'text',
          updatedBy: space.createdBy
        }
      })
    ]);

    const propValues = await prisma.memberPropertyValue.createMany({
      data: [
        {
          memberPropertyId: props[0].id,
          spaceId: space.id,
          updatedBy: user.id,
          userId: user.id,
          value: 'Text'
        },
        {
          memberPropertyId: props[1].id,
          spaceId: space.id,
          updatedBy: user.id,
          userId: user.id,
          value: 'Text'
        },
        {
          memberPropertyId: props[0].id,
          spaceId: space.id,
          updatedBy: spaceMember.id,
          userId: spaceMember.id,
          value: 'Text'
        },
        {
          memberPropertyId: props[1].id,
          spaceId: space.id,
          updatedBy: spaceMember.id,
          userId: spaceMember.id,
          value: 'Text'
        }
      ]
    });

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      content: null
    });

    const { total, details } = await countSpaceBlocks({ spaceId: space.id });

    // 6 member properties + 1 empty page
    expect(total).toBe(7);

    expect(details.memberProperties).toMatchObject<MemberPropertyCounts>({
      total: 6,
      details: {
        memberProperties: 2,
        memberPropertyValues: 4
      }
    });
    expect(details.memberProperties.total).toBe(6);
    expect(details.memberProperties.total).toBe(6);
  });

  it('should count each reward as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      content: null
    });

    const { details, total } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(details.pages.details.rewards).toBe(1);

    expect(total).toBe(1);
  });
});
describe('countSpaceBlocks - count content', () => {
  it('should count the content of the database description, and the content inside each database card / row', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const board = await generateBoard({
      spaceId: space.id,
      createdBy: user.id,
      cardCount: 2,
      views: 2
    });

    const { total, details } = await countSpaceBlocks({ spaceId: space.id });

    expect(details.databaseProperties).toMatchObject<DatabaseBlocksCount>({
      total: 8,
      details: {
        databaseViews: 2,
        databaseDescriptions: 0,
        databaseProperties: 2,
        databaseRowPropValues: 4
      }
    });

    expect(details.pages.total).toBe(3);
    expect(total).toEqual(11);

    const boardBlock = (await prisma.block.findUnique({
      where: {
        id: board.id
      }
    })) as Block;

    await prisma.block.update({
      where: {
        id: boardBlock.id,
        type: 'board'
      },
      data: {
        fields: {
          ...(boardBlock.fields as any),
          description: pageContent
        }
      }
    });

    await prisma.page.updateMany({
      where: {
        type: 'card',
        parentId: board.id
      },
      data: {
        content: pageContent
      }
    });

    const { details: updatedCounts } = await countSpaceBlocks({ spaceId: space.id });

    expect(updatedCounts.pages.details.databases).toBe(1);
    expect(updatedCounts.databaseProperties.details.databaseViews).toBe(2);
    // We should be counting the actual nodes inside the description
    expect(updatedCounts.databaseProperties.details.databaseDescriptions).toBeGreaterThan(1);
    expect(updatedCounts.editorContent).toBeGreaterThan(2);
  });
  it('should count the content inside each page', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      content: pageContent
    });

    const page2 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      content: pageContent
    });

    const { total, details } = await countSpaceBlocks({ spaceId: space.id });

    expect(details.pages.total).toBe(2);
    expect(details.editorContent).toBeGreaterThan(2);
  });
  it('should count the content inside each forum post', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const postCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id
    });

    const posts = await testUtilsForum.generateForumPosts({
      count: 3,
      createdBy: user.id,
      spaceId: space.id,
      categoryId: postCategory.id,
      // Empty content
      content: pageContent
    });

    const { total, details } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(details.forum.details.categories).toBe(1);
    expect(details.forum.details.posts).toBe(3);
    expect(details.forum.details.postContentBlocks).toBeGreaterThan(3);
    expect(details.editorContent).toBe(0);
  });

  it('should count the content inside each reward page', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      content: pageContent
    });

    const { details } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(details.pages.details.rewards).toBe(1);
    expect(details.editorContent).toBeGreaterThan(1);
  });
});
describe('countSpaceBlocksAndSave', () => {
  it('should record an audit of the counts used to calculate the total', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      content: null
    });

    const { count, details } = await countSpaceBlocksAndSave({
      spaceId: space.id
    });

    const loggedCount = await prisma.blockCount.findFirst({
      where: {
        spaceId: space.id
      }
    });

    expect(loggedCount).toMatchObject<BlockCount>({
      spaceId: space.id,
      count,
      createdAt: expect.any(Date),
      id: expect.any(String),
      details
    });
  });
});
