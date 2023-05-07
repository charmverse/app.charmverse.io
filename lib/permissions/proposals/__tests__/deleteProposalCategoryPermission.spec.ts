import { prisma } from '@charmverse/core';
import type { Role, Space, User } from '@charmverse/core/prisma';

import { UndesirableOperationError } from 'lib/utilities/errors';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { deleteProposalCategoryPermission } from '../deleteProposalCategoryPermission';

let space: Space;
let adminUser: User;
let role: Role;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: true
  });
  space = generated.space;
  adminUser = generated.user;
  role = await generateRole({
    createdBy: adminUser.id,
    spaceId: space.id
  });
});

describe('deleteProposalCategoryPermission', () => {
  it('should delete a proposal category permission', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });
    const proposalCategoryPermission = await prisma.proposalCategoryPermission.create({
      data: {
        permissionLevel: 'full_access',
        proposalCategory: { connect: { id: proposalCategory.id } },
        role: { connect: { id: role.id } }
      }
    });

    await deleteProposalCategoryPermission({ permissionId: proposalCategoryPermission.id });

    await expect(
      prisma.proposalCategoryPermission.findUnique({ where: { id: proposalCategoryPermission.id } })
    ).resolves.toEqual(null);
  });
});
