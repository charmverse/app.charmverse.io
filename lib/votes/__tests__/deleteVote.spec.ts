import { v4 } from 'uuid';

import { prisma } from 'db';
import { addSpaceOperations } from 'lib/permissions/spaces';
import { UnauthorisedActionError, UndesirableOperationError } from 'lib/utilities/errors';
import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { deleteVote } from '../deleteVote';

describe('deleteVote', () => {
  it('should return null if vote doesn\'t exist', async () => {
    const vote = await deleteVote(v4(), v4());
    expect(vote).toBe(null);
  });

  it('should return deleted vote', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['createVote']
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id
    });

    await deleteVote(vote.id, user.id);
    expect(await prisma.vote.findUnique({
      where: {
        id: vote.id
      }
    })).toBeFalsy();
  });

  it('should throw error if a proposal context vote is being deleted', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['createVote']
    });

    const vote = await createVote({
      context: 'proposal',
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id
    });

    await expect(deleteVote(vote.id, user.id)).rejects.toBeInstanceOf(UndesirableOperationError);
  });
});
