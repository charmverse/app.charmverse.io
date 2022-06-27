import { Space, User } from '@prisma/client';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { getMentionedTasks } from '../getMentionedTasks';

let user1: User;
let user2: User;
let space1: Space;
let space2: Space;

const mention1Id = v4();
const mention2Id = v4();
const mention3Id = v4();
const mention4Id = v4();

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

  await createPage({
    spaceId: space1.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mention1Id, type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
  });

  // This will be skipped as the mention was created by the same user
  await createPage({
    spaceId: space2.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mention2Id, type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  // This will be skipped as the mention was not for the user
  await createPage({
    spaceId: space2.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mention3Id, type: 'user', value: user2.id, createdAt: new Date().toISOString(), createdBy: user1.id } }] }] }
  });

  await createPage({
    spaceId: space2.id,
    createdBy: user2.id,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mention', attrs: { id: mention4Id, type: 'user', value: user1.id, createdAt: new Date().toISOString(), createdBy: user2.id } }] }] }
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
    expect(marked[0].mentionId).toBe(mention1Id);
    expect(unmarked[0].mentionId).toBe(mention4Id);
  });
});
