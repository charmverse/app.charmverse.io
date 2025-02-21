import type { Space, User, Vote } from '@charmverse/core/prisma';
import { testUtilsProposals } from '@charmverse/core/test';
import { createVote, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { UserIsNotSpaceMemberError } from '@packages/users/errors';
import { DataNotFoundError, UndesirableOperationError } from '@packages/utils/errors';
import { castProposalVote } from '@root/lib/public-api/castProposalVote';
import { v4 as uuid } from 'uuid';

let user: User;
let space: Space;
let proposalId: string;
let vote: Vote;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;

  const proposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: user.id,
    authors: [],
    proposalStatus: 'published',
    evaluationInputs: [
      {
        evaluationType: 'vote',
        reviewers: [],
        permissions: [],
        id: uuid()
      }
    ]
  });
  proposalId = proposal.id;

  vote = await createVote({
    pageId: proposal.id,
    createdBy: user.id,
    spaceId: space.id,
    voteOptions: ['1', '2', '3']
  });
});

describe('castProposalVote', () => {
  it('should cast a vote for proposal by proposalId', async () => {
    const choice = '1';
    const userVote = await castProposalVote({ userId: user.id, proposalId, choice });

    expect(userVote).toMatchObject(
      expect.objectContaining({
        userId: user.id,
        voteId: vote.id,
        choices: [choice]
      })
    );
  });

  it('should not allow casting a vote if the step is inactive', async () => {
    const proposal2 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          reviewers: [],
          permissions: [],
          id: uuid()
        },
        {
          evaluationType: 'vote',
          reviewers: [{ group: 'user', id: user.id }],
          permissions: [],
          id: uuid()
        }
      ]
    });

    await createVote({
      pageId: proposal2.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2', '3']
    });

    const choice = '1';

    await expect(castProposalVote({ userId: user.id, proposalId: proposal2.id, choice })).rejects.toBeInstanceOf(
      UndesirableOperationError
    );
  });

  it('should throw error if proposal does not exist', async () => {
    await expect(castProposalVote({ choice: '4', proposalId: uuid(), userId: user.id })).rejects.toBeInstanceOf(
      DataNotFoundError
    );
  });

  it('should throw error if user does not have access to space', async () => {
    await expect(castProposalVote({ choice: '4', proposalId, userId: uuid() })).rejects.toBeInstanceOf(
      UserIsNotSpaceMemberError
    );
  });
});
