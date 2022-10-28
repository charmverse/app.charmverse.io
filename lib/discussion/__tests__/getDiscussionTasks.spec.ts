import type { Comment, Block, Bounty, Page, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { createPage, createBlock, generateBounty, generateComment, generateThread, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { getDiscussionTasks } from '../getDiscussionTasks';

let user1: User;
let user2: User;
let user3: User;
let space1: Space;
let space2: Space;
let page1: Page;
let page2: Page;
let bounty1: Bounty;
let bounty2: Bounty;
let comment1: Comment;
let comment2: Comment;
let commentBlock: Block;

const discussionIds = new Array(19).fill(0).map(() => v4());

const threadId1 = v4();
const threadId2 = v4();
const commentId1 = discussionIds[14];
const commentId2 = discussionIds[15];
const commentId3 = discussionIds[16];
const commentId4 = discussionIds[17];
const commentId5 = discussionIds[18];

beforeAll(async () => {
  const generated1 = await generateUserAndSpaceWithApiToken();
  const generated2 = await generateUserAndSpaceWithApiToken();
  const generated3 = await generateUserAndSpaceWithApiToken();

  user1 = generated1.user;
  space1 = generated1.space;
  user2 = generated2.user;
  space2 = generated2.space;
  user3 = generated3.user;

  // Making user 1 a member of space 2
  await prisma.spaceRole.create({
    data: {
      spaceId: space2.id,
      userId: user1.id
    }
  });

  page1 = await createPage({
    spaceId: space1.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[0], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  // This will be skipped as the mention was created by the same user
  await createPage({
    spaceId: space2.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[1], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  // This will be skipped as the mention was not for the user
  await createPage({
    spaceId: space2.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[2], type: 'user', value: user2.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  page2 = await createPage({
    spaceId: space2.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[3], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  bounty1 = await generateBounty({
    spaceId: space1.id,
    createdBy: user2.id,
    status: 'complete',
    approveSubmitters: false,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[4], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  // This will be skipped as the mention was created by the same user
  await generateBounty({
    spaceId: space2.id,
    createdBy: user2.id,
    status: 'complete',
    approveSubmitters: false,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[5], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  // This will be skipped as the mention was not for the user
  await generateBounty({
    spaceId: space2.id,
    createdBy: user2.id,
    status: 'complete',
    approveSubmitters: false,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[6], type: 'user', value: user2.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  bounty2 = await generateBounty({
    spaceId: space2.id,
    createdBy: user2.id,
    status: 'complete',
    approveSubmitters: false,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[7], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  comment1 = await generateComment({
    spaceId: space1.id,
    userId: user2.id,
    pageId: page1.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[8], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  // This will be skipped as the mention was created by the same user
  await generateComment({
    spaceId: space2.id,
    userId: user2.id,
    pageId: page1.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[9], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  // This will be skipped as the mention was not for the user
  await generateComment({
    spaceId: space2.id,
    userId: user2.id,
    pageId: page2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[10], type: 'user', value: user2.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  comment2 = await generateComment({
    spaceId: space2.id,
    userId: user2.id,
    pageId: page2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[11], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  commentBlock = await createBlock({
    type: 'comment',
    spaceId: space2.id,
    createdBy: user2.id,
    rootId: page2.id,
    fields: {
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: discussionIds[12], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
    }
  });

  await prisma.userNotification.createMany({
    data: [
      {
        taskId: discussionIds[0],
        type: 'mention',
        userId: user1.id
      }
    ]
  });

  await generateThread({
    thread: {
      id: threadId1,
      spaceId: space1.id,
      userId: user1.id,
      pageId: page1.id,
      comments: [{
        id: commentId1,
        spaceId: space1.id,
        pageId: page1.id,
        userId: user1.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ text: 'New text', type: 'text' }] }] }
      }, {
        id: commentId2,
        spaceId: space1.id,
        pageId: page1.id,
        userId: user2.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ text: 'New text 2', type: 'text' }] }] }
      }, {
        id: commentId3,
        spaceId: space1.id,
        pageId: page1.id,
        userId: user3.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ text: 'New text 3', type: 'text' }] }] }
      }]
    }
  });

  await generateThread({
    thread: {
      id: threadId2,
      spaceId: space2.id,
      userId: user2.id,
      pageId: page2.id,
      comments: [{
        id: commentId4,
        spaceId: space2.id,
        pageId: page2.id,
        userId: user1.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ text: 'New text 12', type: 'text' }] }] }
      }, {
        id: commentId5,
        spaceId: space2.id,
        pageId: page2.id,
        userId: user3.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ text: 'New text 13', type: 'text' }] }] }
      }]
    }
  });
});

describe('getDiscussionTasks', () => {
  function expectSome <T> (arr: T[], condition: (item: T) => boolean) {
    expect(arr.some(condition)).toBeTruthy();
  }

  it('Should return marked and unmarked mention tasks', async () => {

    const { marked, unmarked } = await getDiscussionTasks(user1.id);

    expect(marked.length).toBe(1);
    expect(unmarked.length).toBe(9);

    expectSome(marked, (item) => item.mentionId === discussionIds[0] && item.pageId === page1.id);

    expectSome(unmarked, (item) => (
      item.mentionId === discussionIds[11]
      && item.pageId === page2.id
      && item.commentId === comment2.id));

    expectSome(unmarked, (item) => (
      item.mentionId === discussionIds[8]
      && item.pageId === page1.id
      && item.commentId === comment1.id));

    expectSome(unmarked, (item) => item.mentionId === discussionIds[7] && item.bountyId === bounty2.id);

    expectSome(unmarked, (item) => item.mentionId === discussionIds[4] && item.bountyId === bounty1.id);

    expectSome(unmarked, (item) => item.mentionId === discussionIds[3] && item.pageId === page2.id);

    // finds the comment block mention
    expectSome(unmarked, (item) => item.mentionId === discussionIds[12] && item.pageId === page2.id);
  });

  it('Should return unmarked comments from users that replied to the user thread', async () => {
    const { unmarked } = await getDiscussionTasks(user1.id);

    expectSome(unmarked, (item) => (
      item.commentId === commentId2
      && item.pageId === page1.id
    ));

    expectSome(unmarked, (item) => (
      item.commentId === commentId3
      && item.pageId === page1.id
    ));
  });

  it('Should return unmarked comments from users who commented on another user owned page', async () => {
    const { unmarked } = await getDiscussionTasks(user2.id);

    expectSome(unmarked, (item) => (
      item.commentId === commentId4
      && item.pageId === page2.id
    ));

    expectSome(unmarked, (item) => (
      item.commentId === commentId5
      && item.pageId === page2.id
    ));
  });
});
