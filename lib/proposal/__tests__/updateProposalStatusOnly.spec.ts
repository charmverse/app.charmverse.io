import type { Role, Space, User } from '@charmverse/core/prisma';
import { testUtilsProposals } from '@charmverse/core/test';

import { InvalidStateError } from 'lib/middleware';
import { createProposalWithUsers, generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

import { updateProposalStatusOnly } from '../updateProposalStatusOnly';

describe('updateProposalStatusOnly()', () => {
  let user: User;
  let reviewer: User;
  let reviewerRole: Role;
  let space: Space;

  beforeAll(async () => {
    const generated = await generateUserAndSpace({
      isAdmin: false
    });
    user = generated.user;
    space = generated.space;
    reviewer = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
    reviewerRole = await generateRole({ createdBy: user.id, spaceId: space.id });
  });

  it('Should allow author to move proposal from draft to published', async () => {
    const { id: proposalId } = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'draft'
    });

    const proposal = await updateProposalStatusOnly({
      proposalId,
      newStatus: 'published'
    });

    expect(proposal.status).toBe('published');
    expect(proposal.reviewedBy).toBeNull();
    expect(proposal.reviewedAt).toBeNull();
  });

  it('should throw an error if trying to update an archived proposal', async () => {
    const archivedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'draft',
      archived: true
    });
    await expect(
      updateProposalStatusOnly({
        proposalId: archivedProposal.id,
        newStatus: 'published'
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
});
