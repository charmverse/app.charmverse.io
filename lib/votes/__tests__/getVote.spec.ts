import { createPage, createVote, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';

import { getVote } from '../getVote';

describe('getVote', () => {
  it('should get vote along with user choice and aggregated result', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const createdVote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2'],
      userVotes: ['1']
    });

    const vote = await getVote(createdVote.id, user.id);
    expect(vote).toMatchObject(
      expect.objectContaining({
        id: createdVote.id,
        userChoice: ['1'],
        totalVotes: 1,
        aggregatedResult: {
          1: 1,
          2: 0
        }
      })
    );
  });
});
