import type { ProposalStatus, Role, Space, User } from '@prisma/client';

import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import type { IPageWithPermissions } from 'lib/pages';
import { getPage } from 'lib/pages/server';
import { createProposalWithUsers, generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { proposalPermissionMapping } from '../syncProposalPermissions';
import { updateProposalStatus } from '../updateProposalStatus';

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

    const { proposal } = await updateProposalStatus({
      proposalId: pageWithProposal.proposal?.id as string,
      newStatus: 'reviewed',
      userId: user.id
    });
    expect(proposal.status).toBe('reviewed');
    expect(proposal.reviewedBy).not.toBeNull();
    expect(proposal.reviewedAt).not.toBeNull();
  });

  it('Move a reviewed proposal to discussion status and unassign proposal reviewer and reviewed at fields', async () => {
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'reviewed'
    });

    const { proposal } = await updateProposalStatus({
      proposalId: pageWithProposal.proposal?.id as string,
      newStatus: 'discussion',
      userId: user.id
    });
    expect(proposal.status).toBe('discussion');
    expect(proposal.reviewedBy).toBeNull();
    expect(proposal.reviewedAt).toBeNull();
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
      proposalId: pageWithProposal.proposal?.id as string,
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
      proposalId: pageWithProposal.proposal?.id as string,
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

    const { proposal } = await updateProposalStatus({
      proposalId: pageWithProposal.proposalId as string,
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

  it('should save the snapshot expiry date when changing the status of the proposal to vote active if it was exported to snapshot', async () => {
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      proposalStatus: 'reviewed',
      userId: user.id,
      authors: [],
      reviewers: [reviewer.id, { type: 'role', roleId: reviewerRole.id }]
    });

    await prisma.page.update({
      where: {
        id: pageWithProposal.id
      },
      data: {
        // https://snapshot.org/#/olympusdao.eth/proposal/0x3236041d0857f7548c8da12f3890c6f590a016f02fd2f100230e1b8cbcfed078
        snapshotProposalId: '0x3236041d0857f7548c8da12f3890c6f590a016f02fd2f100230e1b8cbcfed078'
      }
    });

    const { proposal } = await updateProposalStatus({
      proposalId: pageWithProposal.proposalId as string,
      newStatus: 'vote_active',
      userId: user.id
    });

    expect(proposal.snapshotProposalExpiry?.toISOString()).toMatch('2022-10-13T20:55:51');

  });
});
