import { createPage, createVote, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { InvalidInputError, UndesirableOperationError } from '@packages/utils/errors';
import { v4 } from 'uuid';

import { castVote } from '../castVote';

describe('castVote', () => {
  it("should create new user vote if it doesn't exist", async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, true);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2', '3']
    });
    const choice = '1';
    const userVote = await castVote([choice], vote, user.id);
    expect(userVote).toMatchObject(
      expect.objectContaining({
        userId: user.id,
        voteId: vote.id,
        choices: [choice]
      })
    );
  });

  it('should create new user multi-choice vote', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, true);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2', '3'],
      maxChoices: 2
    });
    const choices = ['1', '3'];
    const userVote = await castVote(choices, vote, user.id);
    expect(userVote).toMatchObject(
      expect.objectContaining({
        userId: user.id,
        voteId: vote.id,
        choices
      })
    );
  });

  it('should update existing user vote', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, true);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2', '3'],
      userVotes: ['1']
    });
    const choice = '3';
    const userVote = await castVote([choice], vote, user.id);
    expect(userVote).toMatchObject(
      expect.objectContaining({
        userId: user.id,
        voteId: vote.id,
        choices: [choice]
      })
    );
  });

  it('should update existing user multi-choice', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, true);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2', '3'],
      userVotes: ['1'],
      maxChoices: 2
    });
    const choices = ['3', '1'];
    const userVote = await castVote(choices, vote, user.id);
    expect(userVote).toMatchObject(
      expect.objectContaining({
        userId: user.id,
        voteId: vote.id,
        choices
      })
    );
  });

  it('should throw error if vote status is cancelled', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, true);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      status: 'Cancelled',
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id
    });

    await expect(castVote(['1'], vote, v4())).rejects.toBeInstanceOf(UndesirableOperationError);
  });

  it("should throw error if vote choice isn't one of vote option", async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, true);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2', '3']
    });

    await expect(castVote(['4'], vote, v4())).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw error if user selects more choices than allowed', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, true);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const vote = await createVote({
      pageId: page.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2', '3', '4'],
      maxChoices: 2
    });

    await expect(castVote(['4', '2', '1'], vote, v4())).rejects.toBeInstanceOf(InvalidInputError);
  });
});
