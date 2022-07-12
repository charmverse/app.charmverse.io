import { addSpaceOperations } from 'lib/permissions/spaces';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { deleteVote } from '../deleteVote';

describe('deleteVote', () => {
  it('should return null if vote doesn\'t exist', async () => {
    const vote = await deleteVote(v4(), v4());
    expect(vote).toBe(null);
  });

  it('should throw error if createVote space permission doesn\'t', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id
    });

    await expect(deleteVote(vote.id, user.id)).rejects.toBeInstanceOf(UnauthorisedActionError);
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

    const deletedVote = await deleteVote(vote.id, user.id);
    expect(deletedVote?.id).toBe(vote.id);
  });
});
