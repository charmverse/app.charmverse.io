import type { ProposalStatus, Role, Space, User } from '@prisma/client';
import { createProposalWithUsers, generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { InvalidStateError } from 'lib/middleware';
import type { IPageWithPermissions } from 'lib/pages';
import { getPage } from 'lib/pages/server';
import { updateProposalStatus } from '../updateProposalStatus';
import { proposalPermissionMapping } from '../syncProposalPermissions';

let user: User;
let reviewer: User;
let reviewerRole: Role;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
  reviewer = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  reviewerRole = await generateRole({ createdBy: user.id, spaceId: space.id });
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

  it('Should assign the correct permissions when updating proposal authors and reviewers', async () => {

    const status: ProposalStatus = 'discussion';
    const newStatus: ProposalStatus = 'review';

    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      proposalStatus: status,
      userId: user.id,
      authors: [],
      reviewers: [reviewer.id, { type: 'role', roleId: reviewerRole.id }]
    });

    const proposal = await updateProposalStatus({
      proposal: pageWithProposal.proposalId as string,
      newStatus,
      userId: user.id
    });

    const { permissions } = await getPage(proposal.id) as IPageWithPermissions;

    const permissionTemplate = proposalPermissionMapping[newStatus];

    if (permissionTemplate.author) {
      // Check all authors have a permission
      proposal.authors.forEach((author) => {
        if (author.userId) {
          expect(permissions.some(p => p.userId === author.userId && p.permissionLevel === permissionTemplate.author)).toBe(true);
        }
      });
    }

    if (permissionTemplate.reviewer) {
      proposal.reviewers.forEach((assignedReviewer) => {
        expect(permissions.some(p => (assignedReviewer.userId ? p.userId === assignedReviewer.userId : p.roleId === assignedReviewer.roleId)
        && p.permissionLevel === permissionTemplate.author)).toBe(true);
      });
    }

    if (permissionTemplate.community) {
      expect(permissions.some(p => p.spaceId === proposal.spaceId && p.permissionLevel === permissionTemplate.community)).toBe(true);
    }
  });
});
