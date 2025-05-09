import { VoteStatus } from '@charmverse/core/prisma';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { createPage } from '@packages/testing/setupDatabase';
import { DuplicateDataError } from '@packages/utils/errors';
import { v4 as uuid } from 'uuid';

import { createVote as createVoteService } from '../createVote';

describe('createVote', () => {
  it('should create and return vote', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const createdVote = await createVoteService({
      createdBy: user.id,
      deadline: new Date(),
      content: null,
      contentText: '',
      pageId: page.id,
      spaceId: space.id,
      threshold: 50,
      title: 'First vote',
      type: 'Approval',
      context: 'inline',
      voteOptions: ['1', '2', '3'],
      maxChoices: 1,
      strategy: 'regular'
    });
    expect(createdVote).toMatchObject(
      expect.objectContaining({
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
      })
    );
  });
  it('should create a proposal vote for individual evaluations, but not allow duplicate votes for the same evaluation', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const voteStepId = uuid();
    const secondVoteStepId = uuid();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationInputs: [
        {
          id: voteStepId,
          evaluationType: 'vote',
          permissions: [],
          reviewers: []
        },
        {
          id: secondVoteStepId,
          evaluationType: 'vote',
          permissions: [],
          reviewers: []
        }
      ]
    });

    const createdVote = await createVoteService({
      createdBy: user.id,
      deadline: new Date(),
      content: null,
      contentText: '',
      pageId: proposal.id,
      spaceId: space.id,
      threshold: 50,
      title: 'First vote',
      type: 'Approval',
      context: 'inline',
      voteOptions: ['1', '2', '3'],
      maxChoices: 1,
      evaluationId: voteStepId,
      strategy: 'regular'
    });
    expect(createdVote).toMatchObject(
      expect.objectContaining({
        totalVotes: 0,
        status: VoteStatus.InProgress,
        aggregatedResult: {
          1: 0,
          2: 0,
          3: 0
        },
        userChoice: null,
        pageId: proposal.id,
        spaceId: space.id,
        createdBy: user.id
      })
    );

    const secondCreatedVote = await createVoteService({
      createdBy: user.id,
      deadline: new Date(),
      content: null,
      contentText: '',
      pageId: proposal.id,
      spaceId: space.id,
      threshold: 50,
      title: 'First vote',
      type: 'Approval',
      context: 'inline',
      voteOptions: ['1', '2', '3'],
      maxChoices: 1,
      evaluationId: secondVoteStepId,
      strategy: 'regular'
    });

    await expect(
      createVoteService({
        createdBy: user.id,
        deadline: new Date(),
        content: null,
        contentText: '',
        pageId: proposal.id,
        spaceId: space.id,
        threshold: 50,
        title: 'First vote',
        type: 'Approval',
        context: 'inline',
        voteOptions: ['1', '2', '3'],
        maxChoices: 1,
        evaluationId: voteStepId,
        strategy: 'regular'
      })
    ).rejects.toBeInstanceOf(DuplicateDataError);

    await expect(
      createVoteService({
        createdBy: user.id,
        deadline: new Date(),
        content: null,
        contentText: '',
        pageId: proposal.id,
        spaceId: space.id,
        threshold: 50,
        title: 'First vote',
        type: 'Approval',
        context: 'inline',
        voteOptions: ['1', '2', '3'],
        maxChoices: 1,
        evaluationId: secondVoteStepId,
        strategy: 'regular'
      })
    ).rejects.toBeInstanceOf(DuplicateDataError);
  });
});
