import { Space, User } from '@prisma/client';
import { createProposalWithUsers, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { InvalidStateError } from 'lib/middleware';
import { updateProposalStatus } from '../updateProposalStatus';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('Updates the proposal of a page', () => {
  it('Move a review proposal to reviewed status and assign proposal reviewer and reviewed at fields', async () => {
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'review'
    });

    const updatedProposal = await updateProposalStatus({
      proposal: pageWithProposal.proposal!,
      newStatus: 'reviewed',
      userId: user.id
    });
    expect(updatedProposal.status).toBe('reviewed');
    expect(updatedProposal.reviewedBy).not.toBeNull();
    expect(updatedProposal.reviewedAt).not.toBeNull();
  });

  it('Move a reviewed proposal to discussion status and unassign proposal reviewer and reviewed at fields', async () => {
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'reviewed'
    });

    const updatedProposal = await updateProposalStatus({
      proposal: pageWithProposal.proposal!,
      newStatus: 'discussion',
      userId: user.id
    });
    expect(updatedProposal.status).toBe('discussion');
    expect(updatedProposal.reviewedBy).toBeNull();
    expect(updatedProposal.reviewedAt).toBeNull();
  });

  it('Throw error when trying to move a draft proposal to review', async () => {
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'reviewed'
    });
    await expect(updateProposalStatus({
      proposal: pageWithProposal.proposal!,
      newStatus: 'review',
      userId: user.id
    })).rejects.toBeInstanceOf(InvalidStateError);
  });

  it('Throw error when trying to move a discussion proposal to review without any reviewers attached', async () => {
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'discussion'
    });
    await expect(updateProposalStatus({
      proposal: pageWithProposal.proposal!,
      newStatus: 'review',
      userId: user.id
    })).rejects.toBeInstanceOf(InvalidStateError);
  });
});
