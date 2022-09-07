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
      currentStatus: pageWithProposal.proposal!.status,
      newStatus: 'reviewed',
      proposalId: pageWithProposal.proposalId as string,
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
      currentStatus: pageWithProposal.proposal!.status,
      newStatus: 'discussion',
      proposalId: pageWithProposal.proposalId as string,
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
      currentStatus: 'private_draft',
      newStatus: 'review',
      proposalId: pageWithProposal.proposalId as string,
      userId: user.id
    })).rejects.toBeInstanceOf(InvalidStateError);
  });
});
