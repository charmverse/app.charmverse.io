import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { getVotesByPage } from '../getVotesByPage';

describe('getVotesByPage', () => {
  it('should throw error if createVote space permission doesn\'t', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const createdVote1 = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2'],
      userVotes: ['1']
    });

    const createdVote2 = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      userVotes: ['a']
    });

    const votes = await getVotesByPage(page.id, user.id);
    expect(votes[0]).toMatchObject(expect.objectContaining({
      id: createdVote1.id,
      userChoice: '1',
      totalVotes: 1,
      aggregatedResult: {
        1: 1,
        2: 0
      }
    }));

    expect(votes[1]).toMatchObject(expect.objectContaining({
      id: createdVote2.id,
      userChoice: 'a',
      totalVotes: 1,
      aggregatedResult: {
        a: 1,
        b: 0
      }
    }));
  });
});
