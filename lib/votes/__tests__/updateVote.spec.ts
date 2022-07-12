import { addSpaceOperations } from 'lib/permissions/spaces';
import { DataNotFoundError, UnauthorisedActionError, UndesirableOperationError } from 'lib/utilities/errors';
import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { updateVote } from '../updateVote';

describe('updateVote', () => {
  it('should update and return vote', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'InProgress',
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createVote'],
      spaceId: space.id
    });

    const updatedVote = await updateVote(vote.id, user.id, 'Cancelled');
    expect(updatedVote.status).toBe('Cancelled');
  });

  it('should throw error if vote doesn\'t exist', async () => {
    await expect(updateVote(v4(), v4(), 'Cancelled')).rejects.toBeInstanceOf(DataNotFoundError);
  });

  it('should throw error if vote is not in progress', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'Cancelled',
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    await expect(updateVote(vote.id, v4(), 'Cancelled')).rejects.toBeInstanceOf(UndesirableOperationError);
  });

  it('should throw error if status to be updated is not cancelled', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'InProgress',
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    await expect(updateVote(vote.id, v4(), 'InProgress')).rejects.toBeInstanceOf(UndesirableOperationError);
  });

  it('should throw error if user don\'t have permission to update vote', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'InProgress',
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    await expect(updateVote(vote.id, user.id, 'Cancelled')).rejects.toBeInstanceOf(UnauthorisedActionError);
  });
});
