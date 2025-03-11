import type { Space, User } from '@charmverse/core/prisma';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { createFormResponseCard } from '@root/lib/pages/createFormResponseCard';
import { getDatabaseDetails } from '@root/lib/pages/getDatabaseDetails';
import { createDatabase } from '@root/lib/public-api/createDatabase';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;
});

describe('createFormResponseCard', () => {
  it('should create a card and add properties to board', async () => {
    const createdDb = await createDatabase({
      title: 'Example',
      createdBy: user.id,
      spaceId: space.id
    });

    const mockResponse1 = [
      { question: 'Test q 1', answer: 'answer 1' },
      { question: 'Test q 2', answer: 'answer 2' }
    ];

    const res1 = await createFormResponseCard({
      spaceId: space.id,
      databaseIdorPath: createdDb.id,
      userId: user.id,
      data: mockResponse1
    });

    let udpatedDb = await getDatabaseDetails({ spaceId: space.id, idOrPath: createdDb.id });

    expect((udpatedDb?.fields as any)?.cardProperties.length).toBe(2);
    expect(Object.keys(res1.properties).length).toBe(2);

    const mockResponse2 = [
      { question: 'Test q 1', answer: 'answer 3' },
      { question: 'Test q 2', answer: 'answer 4' }
    ];

    const res2 = await createFormResponseCard({
      spaceId: space.id,
      databaseIdorPath: createdDb.id,
      userId: user.id,
      data: mockResponse2
    });

    udpatedDb = await getDatabaseDetails({ spaceId: space.id, idOrPath: createdDb.id });
    expect((udpatedDb?.fields as any)?.cardProperties.length).toBe(2);
    expect(Object.keys(res2.properties).length).toBe(2);

    const mockResponse3 = [
      { question: 'Test q 2', answer: 'answer 3' },
      { question: 'Test q 3', answer: 'answer 4' }
    ];

    const res3 = await createFormResponseCard({
      spaceId: space.id,
      databaseIdorPath: createdDb.id,
      userId: user.id,
      data: mockResponse3
    });

    udpatedDb = await getDatabaseDetails({ spaceId: space.id, idOrPath: createdDb.id });
    expect((udpatedDb?.fields as any)?.cardProperties.length).toBe(3);
    expect(Object.keys(res3.properties).length).toBe(2);
  });
});
