import type { Space, User } from '@charmverse/core/prisma';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { InvalidInputError } from '@packages/utils/errors';
import { createDatabase } from '@root/lib/public-api/createDatabase';
import { DatabasePageNotFoundError } from '@root/lib/public-api/errors';
import { validateFormRequestInput } from '@root/lib/zapier/validateFormRequestInput';
import { v4 } from 'uuid';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('validateFormRequestInput', () => {
  it('should validate string input', async () => {
    const db = await createDatabase({
      title: 'Example',
      createdBy: user.id,
      spaceId: space.id
    });

    expect(() =>
      validateFormRequestInput({ spaceId: space.id, databaseIdOrPath: db.id, data: '###Question\n\nAnswer' })
    ).not.toThrow();
  });

  it('should validate object input', async () => {
    const db = await createDatabase({
      title: 'Example',
      createdBy: user.id,
      spaceId: space.id
    });

    expect(() =>
      validateFormRequestInput({
        spaceId: space.id,
        databaseIdOrPath: db.id,
        data: { all_responses: '###Question\n\nAnswer' }
      })
    ).not.toThrow();
  });

  it('should validate array input', async () => {
    const db = await createDatabase({
      title: 'Example',
      createdBy: user.id,
      spaceId: space.id
    });

    expect(() =>
      validateFormRequestInput({
        spaceId: space.id,
        databaseIdOrPath: db.id,
        data: [
          { question: 'Question', answer: 'Answer' },
          { question: 'Question 2', answer: 'Answer 2' }
        ]
      })
    ).not.toThrow();
  });

  it('should not validate wrong data input', async () => {
    const db = await createDatabase({
      title: 'Example',
      createdBy: user.id,
      spaceId: space.id
    });

    await expect(
      validateFormRequestInput({
        spaceId: space.id,
        databaseIdOrPath: db.id,
        data: ''
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
    await expect(
      validateFormRequestInput({
        spaceId: space.id,
        databaseIdOrPath: db.id,
        data: {} as any
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      validateFormRequestInput({
        spaceId: space.id,
        databaseIdOrPath: db.id,
        data: [{ question: 'Question' }, { random: 'test' }] as any
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should not validate wrong db id', async () => {
    await expect(
      validateFormRequestInput({
        spaceId: space.id,
        databaseIdOrPath: v4(),
        data: '###Question\n\nAnswer'
      })
    ).rejects.toBeInstanceOf(DatabasePageNotFoundError);
  });
});
