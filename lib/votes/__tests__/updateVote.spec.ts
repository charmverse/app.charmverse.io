import type { VoteContext, VoteStatus } from '@prisma/client';
import { v4 } from 'uuid';

import { addSpaceOperations } from 'lib/permissions/spaces';
import { DataNotFoundError, UnauthorisedActionError, UndesirableOperationError } from 'lib/utilities/errors';
import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { updateVote } from '../updateVote';

async function setupVoteData (params?: { context?: VoteContext, status?: VoteStatus }) {
  const { status = 'InProgress', context = 'inline' } = params ?? {};
  const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

  const page = await createPage({
    createdBy: user.id,
    spaceId: space.id
  });

  const vote = await createVote({
    status,
    context,
    pageId: page.id,
    createdBy: user.id,
    spaceId: space.id,
    voteOptions: ['a', 'b'],
    deadline: new Date(Date.now() - 24 * 60 * 60 * 1000)
  });

  return {
    vote,
    page,
    space,
    user
  };
}

describe('updateVote', () => {
  it('should update and return vote', async () => {
    const { vote, space, user } = await setupVoteData();

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
    const { vote } = await setupVoteData({
      status: 'Cancelled'
    });
    await expect(updateVote(vote.id, v4(), 'Cancelled')).rejects.toBeInstanceOf(UndesirableOperationError);
  });

  it('should fail if the user tries to update the vote status to any other status than cancelled', async () => {
    const { vote } = await setupVoteData();
    await expect(updateVote(vote.id, v4(), 'InProgress')).rejects.toBeInstanceOf(UndesirableOperationError);
  });

  // it('should throw error if user don\'t have permission to update vote', async () => {
  //   const { vote, user } = await setupVoteData();
  //   await expect(updateVote(vote.id, user.id, 'Cancelled')).rejects.toBeInstanceOf(UnauthorisedActionError);
  // });

  it('should throw error if a proposal context vote is being cancelled', async () => {
    const { vote, user, space } = await setupVoteData({
      context: 'proposal'
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createVote'],
      spaceId: space.id
    });

    await expect(updateVote(vote.id, user.id, 'Cancelled')).rejects.toBeInstanceOf(UndesirableOperationError);
  });
});
