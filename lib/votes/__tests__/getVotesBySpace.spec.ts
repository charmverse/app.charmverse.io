import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { getVotesBySpace } from '../getVotesBySpace';

describe('getVotesBySpace', () => {
  it('should get all votes for a space', async () => {
    const { space: space1, user } = await generateUserAndSpaceWithApiToken(undefined, false);
    const { space: space2 } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page1 = await createPage({
      createdBy: user.id,
      spaceId: space1.id
    });

    const page2 = await createPage({
      createdBy: user.id,
      spaceId: space1.id
    });

    const page3 = await createPage({
      createdBy: user.id,
      spaceId: space2.id
    });

    const createdVote1 = await createVote({
      pageId: page1.id,
      createdBy: user.id,
      spaceId: space1.id,
      voteOptions: ['1', '2'],
      userVotes: ['1']
    });

    const createdVote2 = await createVote({
      pageId: page2.id,
      createdBy: user.id,
      spaceId: space1.id,
      voteOptions: ['a', 'b'],
      userVotes: ['a']
    });

    await createVote({
      pageId: page3.id,
      createdBy: user.id,
      spaceId: space2.id,
      voteOptions: ['i', 'ii'],
      userVotes: ['iii']
    });

    const votes = await getVotesBySpace({ spaceId: space1.id, userId: user.id });
    expect(votes[0]).toMatchObject(expect.objectContaining({
      id: createdVote1.id,
      totalVotes: 1,
      status: 'InProgress'
    }));

    expect(votes[1]).toMatchObject(expect.objectContaining({
      id: createdVote2.id,
      totalVotes: 1,
      status: 'InProgress'
    }));
  });
});
