import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { getVoteTasks } from '../getVoteTasks';

describe('getVoteTasks', () => {
  it('should get votes tasks for a user', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    // Not included as the vote has been cancelled
    await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2'],
      status: 'Cancelled',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Included even if the vote is past deadline
    await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'InProgress',
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    // Included since we show votes that have been casted
    await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'InProgress',
      userVotes: ['1'],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const createdVote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const votes = await getVoteTasks(user.id);

    expect(votes[1].id).toBe(createdVote.id);
    expect(votes.length).toBe(3);
  });
});
