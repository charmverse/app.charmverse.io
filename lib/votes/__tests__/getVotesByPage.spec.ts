import { createPage, createVote, generateUserAndSpace } from '@packages/testing/setupDatabase';

import { getVotesByPage } from '../getVotesByPage';

describe('getVotesByPage', () => {
  it('should get votes for a page along with user choice and aggregated result', async () => {
    const { space, user } = await generateUserAndSpace();
    const page1 = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const page2 = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const createdVote1 = await createVote({
      pageId: page1.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2'],
      userVotes: ['1']
    });

    const createdVote2 = await createVote({
      pageId: page1.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      userVotes: ['a']
    });

    await createVote({
      pageId: page2.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      userVotes: ['a']
    });

    const votes = await getVotesByPage({
      pageId: page1.id,
      userId: user.id
    });
    expect(votes[0]).toMatchObject(
      expect.objectContaining({
        id: createdVote1.id,
        userChoice: ['1'],
        totalVotes: 1,
        aggregatedResult: {
          1: 1,
          2: 0
        }
      })
    );

    expect(votes[1]).toMatchObject(
      expect.objectContaining({
        id: createdVote2.id,
        userChoice: ['a'],
        totalVotes: 1,
        aggregatedResult: {
          a: 1,
          b: 0
        }
      })
    );
  });
});
