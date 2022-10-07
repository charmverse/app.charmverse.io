import { VoteStatus } from '@prisma/client';

import { addSpaceOperations } from 'lib/permissions/spaces';
import { DuplicateDataError } from 'lib/utilities/errors';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createVote as createVoteService } from '../createVote';

describe('createVote', () => {
  it('should create and return vote', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createVote'],
      spaceId: space.id
    });

    const createdVote = await createVoteService({
      createdBy: user.id,
      deadline: new Date(),
      description: null,
      pageId: page.id,
      spaceId: space.id,
      threshold: 50,
      title: 'First vote',
      type: 'Approval',
      context: 'inline',
      voteOptions: ['1', '2', '3']
    });
    expect(createdVote).toMatchObject(expect.objectContaining({
      totalVotes: 0,
      status: VoteStatus.InProgress,
      aggregatedResult: {
        1: 0,
        2: 0,
        3: 0
      },
      userChoice: null,
      pageId: page.id,
      spaceId: space.id,
      createdBy: user.id
    }));
  });

  it('should fail to create a proposal vote if a proposal-level vote already exists for this page', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createVote'],
      spaceId: space.id
    });

    await createVoteService({
      createdBy: user.id,
      deadline: new Date(),
      description: null,
      pageId: page.id,
      spaceId: space.id,
      threshold: 50,
      title: 'First vote',
      type: 'Approval',
      context: 'proposal',
      voteOptions: ['1', '2', '3']
    });

    await expect(createVoteService({
      createdBy: user.id,
      deadline: new Date(),
      description: null,
      pageId: page.id,
      spaceId: space.id,
      threshold: 50,
      title: 'First vote',
      type: 'Approval',
      context: 'proposal',
      voteOptions: ['1', '2', '3']
    })).rejects.toBeInstanceOf(DuplicateDataError);
  });
});
