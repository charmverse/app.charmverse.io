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

    // Not included as the vote is past deadline
    await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'InProgress',
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    // This will be included since we show votes that have been casted
    const createdVote3 = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'InProgress',
      userVotes: ['1'],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const createdVote4 = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const votes = await getVoteTasks(user.id);
    expect(votes[0].id).toBe(createdVote3.id);
    expect(votes[1].id).toBe(createdVote4.id);
    expect(votes.length).toBe(2);
  });
});
