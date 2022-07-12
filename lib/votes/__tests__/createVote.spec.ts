import { VoteStatus } from '@prisma/client';
import { addSpaceOperations } from 'lib/permissions/spaces';
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

    const updatedVote = await createVoteService({
      createdBy: user.id,
      deadline: new Date(),
      description: null,
      pageId: page.id,
      spaceId: space.id,
      threshold: 50,
      title: 'First vote',
      type: 'Approval',
      voteOptions: ['1', '2', '3']
    });
    expect(updatedVote).toMatchObject(expect.objectContaining({
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
});
