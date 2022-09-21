import type { Comment, Block, Bounty, Page, Space, User } from '@prisma/client';
import { createPage, createBlock, generateBounty, generateComment, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { getMentionedTasks } from '../getMentionedTasks';

let user1: User;
let user2: User;
let space1: Space;
let space2: Space;
let page1: Page;
let page2: Page;
let bounty1: Bounty;
let bounty2: Bounty;
let comment1: Comment;
let comment2: Comment;
let commentBlock: Block;

const mentionIds = new Array(13).fill(0).map(() => v4());

beforeAll(async () => {
  const generated1 = await generateUserAndSpaceWithApiToken();
  const generated2 = await generateUserAndSpaceWithApiToken();

  user1 = generated1.user;
  space1 = generated1.space;
  user2 = generated2.user;
  space2 = generated2.space;

  // Making user 1 a contributor of space 2
  await prisma.spaceRole.create({
    data: {
      spaceId: space2.id,
      userId: user1.id
    }
  });

  page1 = await createPage({
    spaceId: space1.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[0], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  // This will be skipped as the mention was created by the same user
  await createPage({
    spaceId: space2.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[1], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  // This will be skipped as the mention was not for the user
  await createPage({
    spaceId: space2.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[2], type: 'user', value: user2.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  page2 = await createPage({
    spaceId: space2.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[3], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  bounty1 = await generateBounty({
    spaceId: space1.id,
    createdBy: user2.id,
    status: 'complete',
    approveSubmitters: false,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[4], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  // This will be skipped as the mention was created by the same user
  await generateBounty({
    spaceId: space2.id,
    createdBy: user2.id,
    status: 'complete',
    approveSubmitters: false,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[5], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  // This will be skipped as the mention was not for the user
  await generateBounty({
    spaceId: space2.id,
    createdBy: user2.id,
    status: 'complete',
    approveSubmitters: false,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[6], type: 'user', value: user2.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  bounty2 = await generateBounty({
    spaceId: space2.id,
    createdBy: user2.id,
    status: 'complete',
    approveSubmitters: false,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[7], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  comment1 = await generateComment({
    spaceId: space1.id,
    userId: user2.id,
    pageId: page1.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[8], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  // This will be skipped as the mention was created by the same user
  await generateComment({
    spaceId: space2.id,
    userId: user2.id,
    pageId: page1.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[9], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  // This will be skipped as the mention was not for the user
  await generateComment({
    spaceId: space2.id,
    userId: user2.id,
    pageId: page2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[10], type: 'user', value: user2.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  comment2 = await generateComment({
    spaceId: space2.id,
    userId: user2.id,
    pageId: page2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[11], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  commentBlock = await createBlock({
    type: 'comment',
    spaceId: space2.id,
    createdBy: user2.id,
    rootId: page2.id,
    fields: {
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mentionIds[12], type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
    }
  });

  await prisma.userNotification.createMany({
    data: [
      {
        taskId: mentionIds[0],
        type: 'mention',
        userId: user1.id
      }
    ]
  });
});

describe('getMentionedTasks', () => {

  it('Should return marked and unmarked mention tasks', async () => {

    const { marked, unmarked } = await getMentionedTasks(user1.id);

    function expectSome <T> (arr: T[], condition: (item: T) => boolean) {
      expect(arr.some(condition)).toBeTruthy();
    }

    expect(marked.length).toBe(1);
    expect(unmarked.length).toBe(6);

    expectSome(marked, (item) => item.mentionId === mentionIds[0] && item.pageId === page1.id);

    expectSome(unmarked, (item) => (
      item.mentionId === mentionIds[11]
      && item.pageId === page2.id
      && item.commentId === comment2.id));

    expectSome(unmarked, (item) => (
      item.mentionId === mentionIds[8]
      && item.pageId === page1.id
      && item.commentId === comment1.id));

    expectSome(unmarked, (item) => item.mentionId === mentionIds[7] && item.bountyId === bounty2.id);

    expectSome(unmarked, (item) => item.mentionId === mentionIds[4] && item.bountyId === bounty1.id);

    expectSome(unmarked, (item) => item.mentionId === mentionIds[3] && item.pageId === page2.id);

    // finds the comment block mention
    expectSome(unmarked, (item) => item.mentionId === mentionIds[12] && item.pageId === page2.id);
  });
});
