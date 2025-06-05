import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { ExpectedAnError } from '@packages/testing/errors';
import { generateTokenGate, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { DataNotFoundError, InvalidInputError, UndesirableOperationError } from '@packages/utils/errors';
import { v4 } from 'uuid';

import { unarchiveTokenGate } from '../unarchiveTokenGate';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('unarchiveTokenGate', () => {
  it('should unarchive a token gate successfully', async () => {
    const tokenGate = await generateTokenGate({
      spaceId: space.id,
      createdBy: user.id,
      archived: true
    });

    const unarchived = await unarchiveTokenGate({
      tokenGateId: tokenGate.id,
      spaceId: space.id
    });

    expect(unarchived.archived).toBe(false);

    const tokenGateInDb = await prisma.tokenGate.findUnique({
      where: {
        id: tokenGate.id
      }
    });

    expect(tokenGateInDb?.archived).toBe(false);
  });

  it('should fail if the token gate does not exist', async () => {
    try {
      await unarchiveTokenGate({
        tokenGateId: v4(),
        spaceId: space.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if the token gate is not archived', async () => {
    const tokenGate = await generateTokenGate({
      spaceId: space.id,
      createdBy: user.id
    });

    try {
      await unarchiveTokenGate({
        tokenGateId: tokenGate.id,
        spaceId: space.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should fail if the token gate does not belong to the space', async () => {
    const tokenGate = await generateTokenGate({
      spaceId: space.id,
      createdBy: user.id,
      archived: true
    });

    try {
      await unarchiveTokenGate({
        tokenGateId: tokenGate.id,
        spaceId: v4()
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should fail if unarchiving would exceed the space tier limit', async () => {
    // First create token gates up to the limit
    const maxTokenGates = 3; // Assuming free tier limit
    await Promise.all(
      Array(maxTokenGates)
        .fill(null)
        .map(() =>
          generateTokenGate({
            spaceId: space.id,
            createdBy: user.id
          })
        )
    );

    // Create an archived token gate
    const archivedTokenGate = await generateTokenGate({
      spaceId: space.id,
      createdBy: user.id,
      archived: true
    });

    try {
      await unarchiveTokenGate({
        tokenGateId: archivedTokenGate.id,
        spaceId: space.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      if (err instanceof Error) {
        expect(err).toBeInstanceOf(UndesirableOperationError);
        expect(err.message).toContain('maximum number of token gates');
      }
    }
  });
});
