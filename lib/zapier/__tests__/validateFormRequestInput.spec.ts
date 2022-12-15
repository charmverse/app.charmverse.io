import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { createDatabase } from 'lib/public-api/createDatabaseCardPage';
import { DatabasePageNotFoundError } from 'lib/public-api/errors';
import { InvalidInputError } from 'lib/utilities/errors';
import { validateFormRequestInput } from 'lib/zapier/validateFormRequestInput';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

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
      validateFormRequestInput({ spaceId: space.id, databaseId: db.id, data: '###Question\n\nAnswer' })
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
        databaseId: db.id,
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
        databaseId: db.id,
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
        databaseId: db.id,
        data: ''
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
    await expect(
      validateFormRequestInput({
        spaceId: space.id,
        databaseId: db.id,
        data: {} as any
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      validateFormRequestInput({
        spaceId: space.id,
        databaseId: db.id,
        data: [{ question: 'Question' }, { random: 'test' }] as any
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should not validate wrong db id', async () => {
    await expect(
      validateFormRequestInput({
        spaceId: space.id,
        databaseId: v4(),
        data: '###Question\n\nAnswer'
      })
    ).rejects.toBeInstanceOf(DatabasePageNotFoundError);
  });
});
