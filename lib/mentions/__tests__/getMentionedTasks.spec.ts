import { Comment, Bounty, Page, Space, User } from '@prisma/client';
import { createPage, generateBounty, generateComment, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
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

const mentionIds = new Array(12).fill(0).map(() => v4());

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

    expect(marked.length).toBe(1);
    expect(unmarked.length).toBe(5);
    expect(marked[0].mentionId).toBe(mentionIds[0]);
    expect(marked[0].pageId).toBe(page1.id);

    expect(unmarked[0].mentionId).toBe(mentionIds[11]);
    expect(unmarked[0].pageId).toBe(page2.id);
    expect(unmarked[0].commentId).toBe(comment2.id);

    expect(unmarked[1].mentionId).toBe(mentionIds[8]);
    expect(unmarked[1].commentId).toBe(comment1.id);
    expect(unmarked[1].pageId).toBe(page1.id);

    expect(unmarked[2].mentionId).toBe(mentionIds[7]);
    expect(unmarked[2].bountyId).toBe(bounty2.id);

    expect(unmarked[3].mentionId).toBe(mentionIds[4]);
    expect(unmarked[3].bountyId).toBe(bounty1.id);

    expect(unmarked[4].mentionId).toBe(mentionIds[3]);
    expect(unmarked[4].pageId).toBe(page2.id);
  });
});
