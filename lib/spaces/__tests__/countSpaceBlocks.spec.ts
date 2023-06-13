import type { Block, BlockCount } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import {
  testUtilsBounties,
  testUtilsForum,
  testUtilsPages,
  testUtilsProposals,
  testUtilsUser
} from '@charmverse/core/test';

import { emptyDocument } from 'lib/prosemirror/constants';
import { generateBoard } from 'testing/setupDatabase';

import { countSpaceBlocks, countSpaceBlocksAndSave } from '../countSpaceBlocks';

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

describe('countSpaceBlocks - count blocks', () => {
  it('should count each database, database view and database card / row as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const board = await generateBoard({
      spaceId: space.id,
      createdBy: user.id,
      cardCount: 2,
      views: 2
    });

    const { total, counts } = await countSpaceBlocks({ spaceId: space.id });

    expect(counts.boards).toBe(1);
    expect(counts.views).toBe(2);
    expect(counts.cards).toBe(2);
    // We are already counting the board block, we shouldn't duplicate the count as a page
    expect(counts.pages).toBe(0);

    expect(total).toEqual(5);
  });

  it('should count each document page as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      content: {}
    });

    const page2 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      content: {}
    });

    const { total, counts } = await countSpaceBlocks({ spaceId: space.id });

    expect(counts.pages).toBe(2);
    // Empty documents with no nodes to count
    expect(counts.documentBlocks).toBe(0);

    expect(total).toEqual(2);
  });
  it('should count each page comment and inline comment as 1 block, excluding deleted comments', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      content: {}
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

    const { total, counts } = await countSpaceBlocks({ spaceId: space.id });

    expect(counts.pages).toBe(1);
    expect(counts.comments).toBe(2);
    // Empty documents with no nodes to count
    expect(counts.documentBlocks).toBe(0);

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
      content: {}
    });

    const { total, counts } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(counts.forumCategories).toBe(1);
    expect(counts.forumPosts).toBe(3);

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
      content: {}
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

    const { total, counts } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(counts.forumCategories).toBe(1);
    expect(counts.forumPosts).toBe(1);
    expect(counts.comments).toBe(totalComments);

    expect(total).toBe(2 + totalComments);
  });

  it('should count each member property as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    await prisma.memberProperty.createMany({
      data: [
        {
          createdBy: user.id,
          name: 'Property 1',
          spaceId: space.id,
          type: 'email',
          updatedBy: user.id
        },
        {
          createdBy: user.id,
          name: 'Property 2',
          spaceId: space.id,
          type: 'github',
          updatedBy: user.id
        }
      ]
    });

    const { counts, total } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(counts.memberProperties).toBe(2);
    expect(total).toBe(2);
  });

  it('should count each proposal category and proposal as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      categoryId: proposalCategory.id,
      content: {}
    });

    const { counts, total } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(counts.proposalCategories).toBe(1);
    expect(counts.proposals).toBe(1);
    expect(counts.documentBlocks).toBe(0);

    expect(total).toBe(2);
  });

  it('should count each bounty as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      content: {}
    });

    const { counts, total } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(counts.bounties).toBe(1);

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

    const { total, counts } = await countSpaceBlocks({ spaceId: space.id });

    expect(counts.boards).toBe(1);
    expect(counts.views).toBe(2);
    expect(counts.cards).toBe(2);
    // We are already counting the board block, we shouldn't duplicate the count as a page
    expect(counts.pages).toBe(0);

    expect(total).toEqual(5);

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

    const { counts: updatedCounts } = await countSpaceBlocks({ spaceId: space.id });

    expect(updatedCounts.boards).toBe(1);
    expect(updatedCounts.views).toBe(2);
    // We should be counting the actual nodes inside the description
    expect(updatedCounts.boardDescriptionBlocks).toBeGreaterThan(1);
    // We are already counting the board block, we shouldn't duplicate the count as a page or its page content
    expect(updatedCounts.pages).toBe(0);
    expect(updatedCounts.documentBlocks).toBeGreaterThan(2);
  });
  // TODO - Figure out how this works
  // it('should count each database comment', async() => {

  // })

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

    const { total, counts } = await countSpaceBlocks({ spaceId: space.id });

    expect(counts.pages).toBe(2);
    expect(counts.documentBlocks).toBeGreaterThan(2);
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

    const { total, counts } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(counts.forumCategories).toBe(1);
    expect(counts.forumPosts).toBe(3);
    expect(counts.forumPostBlocks).toBeGreaterThan(3);
    expect(counts.documentBlocks).toBe(0);
  });

  it('should count the content inside each proposal', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      categoryId: proposalCategory.id,
      content: pageContent
    });

    const { counts, total } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(counts.proposalCategories).toBe(1);
    expect(counts.proposals).toBe(1);
    expect(counts.documentBlocks).toBeGreaterThan(1);
  });

  it('should count the content inside each bounty page', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      content: pageContent
    });

    const { counts, total } = await countSpaceBlocks({
      spaceId: space.id
    });

    expect(counts.bounties).toBe(1);
    expect(counts.documentBlocks).toBeGreaterThan(1);
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
      content: {}
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
