import type { ProposalPermissionFlags } from '@charmverse/core';
import { prisma, proposalOperations, testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core';
import type { ProposalCategory, ProposalOperation, Role, Space, User } from '@charmverse/core/prisma';
import { v4 } from 'uuid';

import { ProposalNotFoundError } from 'lib/proposal/errors';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { InvalidInputError } from 'lib/utilities/errors';

import { baseComputeProposalPermissions } from '../computeProposalPermissions';

let adminUser: User;
let spaceMemberUser: User;
let proposalAuthor: User;
let proposalReviewer: User;
let proposalReviewerByRole: User;
let space: Space;

let role: Role;

let otherSpace: Space;
let otherSpaceAdminUser: User;

let proposal: ProposalWithUsers;
let proposalCategory: ProposalCategory;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  proposalAuthor = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  proposalReviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  proposalReviewerByRole = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

  const secondGenerated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  otherSpaceAdminUser = secondGenerated.user;
  otherSpace = secondGenerated.space;

  role = await testUtilsMembers.generateRole({
    createdBy: adminUser.id,
    spaceId: space.id,
    assigneeUserIds: [proposalReviewerByRole.id]
  });

  proposalCategory = await testUtilsProposals.generateProposalCategory({ spaceId: space.id });
  proposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    categoryId: proposalCategory.id,
    userId: proposalAuthor.id,
    authors: [proposalAuthor.id],
    proposalStatus: 'discussion',
    reviewers: [
      {
        id: proposalReviewer.id,
        group: 'user'
      },
      {
        group: 'role',
        id: role.id
      }
    ]
  });
});

// Defining these here so that the test is more resilient against future changes
const authorPermissions: ProposalOperation[] = ['view', 'comment', 'vote', 'create_vote', 'edit', 'delete'];
const reviewerPermissions: ProposalOperation[] = ['view', 'comment', 'review'];

const spaceMemberPermisions: Pick<ProposalPermissionFlags, 'view' | 'comment' | 'vote'> = {
  comment: true,
  vote: true,
  view: true
};

describe('computeProposalPermissions - base', () => {
  it('should allow the author to view, edit, comment, vote, create_vote and delete the proposal', async () => {
    const permissions = await baseComputeProposalPermissions({
      resourceId: proposal.id,
      userId: proposalAuthor.id
    });

    proposalOperations.forEach((op) => {
      if (authorPermissions.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should not provide any author or reviewer permissions to an author / reviewer if this person is no longer a space member', async () => {
    const removedMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const removedMemberProposal = await testUtilsProposals.generateProposal({
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: removedMember.id
    });

    // Member leaves the space
    await prisma.spaceRole.deleteMany({
      where: {
        spaceId: space.id,
        userId: removedMember.id
      }
    });

    const permissions = await baseComputeProposalPermissions({
      resourceId: removedMemberProposal.id,
      userId: removedMember.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>({
      comment: false,
      create_vote: false,
      delete: false,
      edit: false,
      make_public: false,
      review: false,
      vote: false,
      // Proposal is always public
      view: true
    });
  });

  it('should allow the reviewer to review the proposal', async () => {
    const permissions = await baseComputeProposalPermissions({
      resourceId: proposal.id,
      userId: proposalReviewer.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>({
      ...spaceMemberPermisions,
      review: true,
      edit: false,
      make_public: false,
      delete: false,
      create_vote: false
    });
  });

  // Important as in public mode, we don't account for custom roles.
  it('should not provide reviewer permissions to a reviewer added by role', async () => {
    const permissions = await baseComputeProposalPermissions({
      resourceId: proposal.id,
      userId: proposalReviewerByRole.id
    });

    expect(permissions.review).toBe(false);
  });

  it('should allow space members to comment and vote on the proposal', async () => {
    const permissions = await baseComputeProposalPermissions({
      resourceId: proposal.id,
      userId: spaceMemberUser.id
    });
    expect(permissions).toMatchObject<ProposalPermissionFlags>({
      vote: true,
      view: true,
      comment: true,
      create_vote: false,
      delete: false,
      edit: false,
      make_public: false,
      review: false
    });
  });

  it('should give an admin full permissions except make_public', async () => {
    const permissions = await baseComputeProposalPermissions({
      resourceId: proposal.id,
      userId: adminUser.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>({
      vote: true,
      view: true,
      comment: true,
      create_vote: true,
      delete: true,
      edit: true,
      review: true,
      make_public: false
    });
  });

  it('should always provide the view permission', async () => {
    const permissions = await baseComputeProposalPermissions({
      resourceId: proposal.id,
      // A public user
      userId: undefined
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>({
      comment: false,
      create_vote: false,
      delete: false,
      edit: false,
      make_public: false,
      review: false,
      vote: false,
      view: true
    });
  });

  it('should throw an error if the proposal does not exist or proposalId is invalid', async () => {
    await expect(
      baseComputeProposalPermissions({
        resourceId: v4(),
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(ProposalNotFoundError);

    await expect(
      baseComputeProposalPermissions({
        resourceId: null as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      baseComputeProposalPermissions({
        resourceId: 'text' as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
