import { prisma } from '@charmverse/core';
import type { ProposalCategoryPermissionLevel, Space, User } from '@charmverse/core/dist/prisma';
import { v4 } from 'uuid';

import { addSpaceOperations } from 'lib/permissions/spaces';
import { ProposalCategoryNotFoundError } from 'lib/proposal/errors';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { computeProposalCategoryPermissions } from '../computeProposalCategoryPermissions';
import { proposalCategoryOperations } from '../interfaces';

let adminUser: User;
let spaceMemberUser: User;
let space: Space;

let otherSpace: Space;
let otherSpaceAdminUser: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

  const secondGenerated = await generateUserAndSpace({ isAdmin: true });
  otherSpaceAdminUser = secondGenerated.user;
  otherSpace = secondGenerated.space;
});

describe('computeProposalCategoryPermissions', () => {
  it('should return only create_proposal for someone with full access', async () => {
    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMemberUser.id]
    });
    const proposalCategory = await generateProposalCategory({ spaceId: space.id });

    const assignedPermission: ProposalCategoryPermissionLevel = 'full_access';

    await prisma.proposalCategoryPermission.create({
      data: {
        permissionLevel: assignedPermission,
        proposalCategory: { connect: { id: proposalCategory.id } },
        role: { connect: { id: role.id } }
      }
    });

    const permissions = await computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: spaceMemberUser.id
    });

    proposalCategoryOperations.forEach((op) => {
      if (op === 'create_proposal') {
        expect(permissions[op]).toBe(true);
      } else {
        expect(permissions[op]).toBe(false);
      }
    });
  });

  it('should not return any category-level overrides if user is a space wide reviewer', async () => {
    const spaceWideReviewerUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceWideReviewerUser.id]
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['reviewProposals'],
      roleId: role.id
    });
    const proposalCategory = await generateProposalCategory({ spaceId: space.id });

    const permissions = await computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: spaceWideReviewerUser.id
    });

    proposalCategoryOperations.forEach((op) => {
      expect(permissions[op]).toBe(false);
    });
  });

  it('should always return full permissions for a space administrator', async () => {
    const proposalCategory = await generateProposalCategory({ spaceId: space.id });
    const permissions = await computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: adminUser.id
    });

    proposalCategoryOperations.forEach((op) => {
      expect(permissions[op]).toBe(true);
    });
  });

  it('should ignore permissions in the database for users who are not members of the space as well as members of the public, and return empty proposal category permissions', async () => {
    const proposalCategory = await generateProposalCategory({ spaceId: space.id });

    // This should never usually happen, but if it somehow does, we want the compute operation to act as a failsafe
    await prisma.proposalCategoryPermission.create({
      data: {
        permissionLevel: 'full_access',
        proposalCategory: { connect: { id: proposalCategory.id } },
        space: { connect: { id: otherSpace.id } }
      }
    });

    const permissions = await computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: otherSpaceAdminUser.id
    });
    proposalCategoryOperations.forEach((op) => {
      expect(permissions[op]).toBe(false);
    });

    const publicPermissions = await computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: undefined
    });
    proposalCategoryOperations.forEach((op) => {
      expect(publicPermissions[op]).toBe(false);
    });
  });

  it('should treat a user with guest-level membership in space as a public user and return empty proposal category permissions', async () => {
    const proposalCategory = await generateProposalCategory({ spaceId: space.id });

    // This should never usually happen, but if it somehow does, we want the compute operation to act as a failsafe
    await prisma.proposalCategoryPermission.create({
      data: {
        permissionLevel: 'full_access',
        proposalCategory: { connect: { id: proposalCategory.id } },
        space: { connect: { id: space.id } }
      }
    });

    await prisma.proposalCategoryPermission.create({
      data: {
        permissionLevel: 'view',
        proposalCategory: { connect: { id: proposalCategory.id } },
        public: true
      }
    });

    const guestUser = await generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });

    const guestPermissions = await computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: guestUser.id
    });
    proposalCategoryOperations.forEach((op) => {
      expect(guestPermissions[op]).toBe(false);
    });
  });

  it('should throw an error if the proposal category does not exist or is invalid', async () => {
    await expect(
      computeProposalCategoryPermissions({
        resourceId: v4(),
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(ProposalCategoryNotFoundError);

    await expect(
      computeProposalCategoryPermissions({
        resourceId: null as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      computeProposalCategoryPermissions({
        resourceId: 'text' as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
