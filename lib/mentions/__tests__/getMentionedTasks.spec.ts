import { Page, Space, User } from '@prisma/client';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { getMentionedTasks } from '../getMentionedTasks';
import { MentionedTask } from '../interfaces';

let user1: User;
let user2: User;
let space1: Space;
let space2: Space;
let page1: Page;
let page2: Page;

const mention1Id = v4();
const mention2Id = v4();
const mention3Id = v4();

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
    createdBy: user1.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mention1Id, type: 'user', value: user1.id, createdAt: '2022-06-14T16:24', createdBy: user2.id } }] }] }
  });

  page2 = await createPage({
    spaceId: space2.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mention2Id, type: 'user', value: user1.id, createdAt: '2022-06-14T16:24', createdBy: user1.id } }] }] }
  });

  await createPage({
    spaceId: space2.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mention3Id, type: 'user', value: user2.id, createdAt: '2022-06-14T16:24', createdBy: user1.id } }] }] }
  });

  await prisma.userNotification.create({
    data: {
      taskId: mention1Id,
      type: 'mention',
      userId: user1.id
    }
  });
});

describe('getMentionedTasks', () => {
  it('Should return marked and unmarked mention tasks', async () => {

    const { marked, unmarked } = await getMentionedTasks(user1.id);

    expect(marked.length).toBe(1);
    expect(unmarked.length).toBe(1);
    expect(marked[0]).toMatchObject(expect.objectContaining<Pick<MentionedTask, 'mentionId' | 'pageId' | 'spaceId'> & {createdBy: Pick<User, 'id'>}>({
      mentionId: mention1Id,
      pageId: page1.id,
      spaceId: space1.id,
      createdBy: expect.objectContaining({
        id: user2.id
      })
    }));
    expect(unmarked[0]).toMatchObject(expect.objectContaining<Pick<MentionedTask, 'mentionId' | 'pageId' | 'spaceId'> & {createdBy: Pick<User, 'id'>}>({
      mentionId: mention2Id,
      pageId: page2.id,
      spaceId: space2.id,
      createdBy: expect.objectContaining({
        id: user1.id
      })
    }));
  });
});
