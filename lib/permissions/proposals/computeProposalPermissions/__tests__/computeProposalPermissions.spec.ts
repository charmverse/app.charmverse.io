import type { ProposalCategory, ProposalOperation, Role, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { ProposalNotFoundError } from 'lib/proposal/errors';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { proposalOperations } from '../../interfaces';
import { proposalPermissionsMapping } from '../../mapping';
import { upsertProposalCategoryPermission } from '../../upsertProposalCategoryPermission';
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
  const generated = await generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  proposalAuthor = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  proposalReviewer = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  proposalReviewerByRole = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

  const secondGenerated = await generateUserAndSpace({ isAdmin: true });
  otherSpaceAdminUser = secondGenerated.user;
  otherSpace = secondGenerated.space;

  role = await generateRole({
    createdBy: adminUser.id,
    spaceId: space.id,
    assigneeUserIds: [proposalReviewerByRole.id]
  });

  proposalCategory = await generateProposalCategory({ spaceId: space.id });
  proposal = await generateProposal({
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
const authorPermissions: ProposalOperation[] = ['view', 'comment', 'vote', 'edit', 'delete'];
const reviewerPermissions: ProposalOperation[] = ['view', 'comment', 'review'];

describe('computeProposalPermissions - base', () => {
  it('should allow the author to view, edit, comment, vote and delete the proposal', async () => {
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

  it('should allow the reviewer to view, comment, review the proposal', async () => {
    const permissions = await baseComputeProposalPermissions({
      resourceId: proposal.id,
      userId: proposalReviewer.id
    });

    proposalOperations.forEach((op) => {
      if (reviewerPermissions.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should allow the reviewer with a role added as a reviewer to view, comment, review, vote the proposal', async () => {
    const permissions = await baseComputeProposalPermissions({
      resourceId: proposal.id,
      userId: proposalReviewer.id
    });

    proposalOperations.forEach((op) => {
      if (reviewerPermissions.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should give an admin full permissions', async () => {
    const permissions = await baseComputeProposalPermissions({
      resourceId: proposal.id,
      userId: adminUser.id
    });

    proposalOperations.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });
  });

  // We'll often assign member-level access at space level
  it('should take into account space-level permissions', async () => {
    const otherProposalCategory = await generateProposalCategory({ spaceId: space.id });
    const otherProposal = await generateProposal({
      spaceId: space.id,
      categoryId: otherProposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'discussion',
      reviewers: []
    });

    await upsertProposalCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      proposalCategoryId: otherProposalCategory.id
    });

    const permissions = await baseComputeProposalPermissions({
      resourceId: otherProposal.id,
      userId: spaceMemberUser.id
    });

    const memberPermissions = proposalPermissionsMapping.full_access;

    proposalOperations.forEach((op) => {
      if (memberPermissions.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should take into account role-level permissions', async () => {
    const otherProposalCategory = await generateProposalCategory({ spaceId: space.id });
    const otherProposal = await generateProposal({
      spaceId: space.id,
      categoryId: otherProposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'discussion',
      reviewers: []
    });

    await upsertProposalCategoryPermission({
      assignee: { group: 'role', id: role.id },
      permissionLevel: 'full_access',
      proposalCategoryId: otherProposalCategory.id
    });

    const permissions = await baseComputeProposalPermissions({
      resourceId: otherProposal.id,
      userId: proposalReviewerByRole.id
    });

    const memberPermissions = proposalPermissionsMapping.full_access;

    proposalOperations.forEach((op) => {
      if (memberPermissions.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should apply public permissions to space members', async () => {
    const otherProposalCategory = await generateProposalCategory({ spaceId: space.id });
    const otherProposal = await generateProposal({
      spaceId: space.id,
      categoryId: otherProposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'discussion',
      reviewers: []
    });

    // This should never usually happen, but if it somehow does, we want the compute operation to act as a failsafe
    await prisma.proposalCategoryPermission.create({
      data: {
        permissionLevel: 'view',
        proposalCategory: { connect: { id: otherProposalCategory.id } },
        public: true
      }
    });

    await upsertProposalCategoryPermission({
      assignee: { group: 'public' },
      permissionLevel: 'view',
      proposalCategoryId: otherProposalCategory.id
    });

    const permissions = await baseComputeProposalPermissions({
      resourceId: otherProposal.id,
      userId: spaceMemberUser.id
    });

    const guestOperations = proposalPermissionsMapping.view;

    proposalOperations.forEach((op) => {
      if (guestOperations.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should ignore permissions in the database for users who are not members of the space as well as members of the public, and return only proposal permissions assigned to the public level', async () => {
    const otherProposalCategory = await generateProposalCategory({ spaceId: space.id });
    const otherProposal = await generateProposal({
      spaceId: space.id,
      categoryId: otherProposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'discussion',
      reviewers: []
    });

    // This should never usually happen, but if it somehow does, we want the compute operation to act as a failsafe
    await prisma.proposalCategoryPermission.create({
      data: {
        permissionLevel: 'full_access',
        proposalCategory: { connect: { id: otherProposalCategory.id } },
        space: { connect: { id: otherSpace.id } }
      }
    });
    await prisma.proposalCategoryPermission.create({
      data: {
        permissionLevel: 'view',
        proposalCategory: { connect: { id: otherProposalCategory.id } },
        public: true
      }
    });

    const permissions = await baseComputeProposalPermissions({
      resourceId: otherProposal.id,
      userId: otherSpaceAdminUser.id
    });

    const guestOperations = proposalPermissionsMapping.view;

    proposalOperations.forEach((op) => {
      if (guestOperations.includes(op)) {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });

    // Same as above, without a requesting user
    const publicPermissions = await baseComputeProposalPermissions({
      resourceId: proposal.id,
      userId: undefined
    });
    proposalOperations.forEach((op) => {
      if (guestOperations.includes(op)) {
        expect(publicPermissions[op]).toBe(true);
      } else {
        expect(publicPermissions[op]).toBe(false);
      }
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
