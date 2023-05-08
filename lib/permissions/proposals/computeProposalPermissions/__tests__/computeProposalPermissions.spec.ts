import type { ProposalPermissionFlags } from '@charmverse/core';
import { prisma } from '@charmverse/core';
import type { ProposalCategory, ProposalStatus, Role, Space, User } from '@charmverse/core/prisma';
import { v4 } from 'uuid';

import { ProposalNotFoundError } from 'lib/proposal/errors';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { upsertProposalCategoryPermission } from '../../upsertProposalCategoryPermission';
import { computeProposalPermissions } from '../computeProposalPermissions';

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
});
describe('computeProposalPermissions', () => {
  it('should allow the author to view, comment, delete, make public when the proposal is in review stage', async () => {
    const testedProposal = await generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'review',
      reviewers: [
        {
          id: proposalReviewer.id,
          group: 'user'
        }
      ]
    });

    const permissions = await computeProposalPermissions({
      resourceId: testedProposal.id,
      userId: proposalAuthor.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>({
      view: true,
      comment: true,
      delete: true,
      create_vote: false,
      edit: false,
      review: false,
      vote: false,
      make_public: true
    });
  });

  it('should allow the reviewer to view, comment, review the proposal when it is in review stage', async () => {
    const testedProposal = await generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'review',
      reviewers: [
        {
          id: proposalReviewer.id,
          group: 'user'
        }
      ]
    });

    const permissions = await computeProposalPermissions({
      resourceId: testedProposal.id,
      userId: proposalReviewer.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>({
      view: true,
      comment: true,
      review: true,
      delete: false,
      create_vote: false,
      edit: false,
      vote: false,
      make_public: false
    });
  });

  it('should allow the reviewer with a role added as a reviewer to view, comment, review, vote the proposal', async () => {
    const testedProposal = await generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'review',
      reviewers: [
        {
          id: role.id,
          group: 'role'
        }
      ]
    });

    const permissions = await computeProposalPermissions({
      resourceId: testedProposal.id,
      userId: proposalReviewerByRole.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>({
      view: true,
      comment: true,
      review: true,
      delete: false,
      create_vote: false,
      edit: false,
      vote: false,
      make_public: false
    });
  });

  it('should allow the admin to always see proposals, but only edit the proposal during the discussion, review and reviewed stages', async () => {
    const testedProposal = await generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'draft',
      reviewers: [
        {
          id: role.id,
          group: 'role'
        }
      ]
    });

    const permissions = await computeProposalPermissions({
      resourceId: testedProposal.id,
      userId: adminUser.id
    });

    expect(permissions.edit).toBe(false);

    const editableStatuses: ProposalStatus[] = ['discussion', 'review', 'reviewed'];

    for (const status of editableStatuses) {
      await prisma.proposal.update({ where: { id: testedProposal.id }, data: { status } });
      const permissionsAtStage = await computeProposalPermissions({
        resourceId: testedProposal.id,
        userId: adminUser.id
      });

      expect(permissionsAtStage.edit).toBe(true);
      expect(permissionsAtStage.view).toBe(true);
    }

    const readonlyStatuses: ProposalStatus[] = ['vote_active', 'vote_closed'];

    for (const status of readonlyStatuses) {
      await prisma.proposal.update({ where: { id: testedProposal.id }, data: { status } });
      const permissionsAtStage = await computeProposalPermissions({
        resourceId: testedProposal.id,
        userId: adminUser.id
      });

      expect(permissionsAtStage.edit).toBe(false);
      expect(permissionsAtStage.view).toBe(true);
    }
  });

  // We'll often assign member-level access at space level
  it('should take into account space-level permissions, for example allowing members with full access via the space to view and comment on the proposal at the discussion stage', async () => {
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

    const memberPermissions = await computeProposalPermissions({
      resourceId: otherProposal.id,
      userId: spaceMemberUser.id
    });
    expect(memberPermissions).toMatchObject<ProposalPermissionFlags>({
      view: true,
      comment: true,
      review: false,
      delete: false,
      create_vote: false,
      edit: false,
      vote: false,
      make_public: false
    });
  });

  it('should take into account role-level permissions, for example allowing members with full access via their assigned role to view and comment on the proposal at the discussion stage', async () => {
    const otherProposalCategory = await generateProposalCategory({ spaceId: space.id });
    const otherProposal = await generateProposal({
      spaceId: space.id,
      categoryId: otherProposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'discussion',
      reviewers: []
    });
    const memberWithAssignedRole = await generateSpaceUser({
      spaceId: space.id
    });

    const testedRole = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [memberWithAssignedRole.id]
    });

    await upsertProposalCategoryPermission({
      assignee: { group: 'role', id: testedRole.id },
      permissionLevel: 'full_access',
      proposalCategoryId: otherProposalCategory.id
    });

    const memberWithRolePermissions = await computeProposalPermissions({
      resourceId: otherProposal.id,
      userId: memberWithAssignedRole.id
    });

    expect(memberWithRolePermissions).toMatchObject<ProposalPermissionFlags>({
      view: true,
      comment: true,
      review: false,
      delete: false,
      create_vote: false,
      edit: false,
      vote: false,
      make_public: false
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

    const permissions = await computeProposalPermissions({
      resourceId: otherProposal.id,
      userId: spaceMemberUser.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>({
      view: true,
      // Read-only proposal category
      comment: false,
      review: false,
      delete: false,
      create_vote: false,
      edit: false,
      vote: false,
      make_public: false
    });
  });

  it('should throw an error if the proposal does not exist or proposalId is invalid', async () => {
    await expect(
      computeProposalPermissions({
        resourceId: v4(),
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(ProposalNotFoundError);

    await expect(
      computeProposalPermissions({
        resourceId: null as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      computeProposalPermissions({
        resourceId: 'text' as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
