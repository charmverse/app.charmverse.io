import type { ProposalCategoryPermission } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { ProposalCategoryNotFoundError } from 'lib/proposal/errors';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { assignDefaultProposalCategoryPermissions } from '../assignDefaultProposalCategoryPermission';

describe('assignDefaultProposalCategoryPermission', () => {
  it('should create a space / full access permission by default', async () => {
    const { space } = await generateUserAndSpace({ isAdmin: false });

    const category = await generateProposalCategory({ spaceId: space.id });

    await assignDefaultProposalCategoryPermissions({ proposalCategoryId: category.id });

    const permissions = await prisma.proposalCategoryPermission.findMany({
      where: {
        proposalCategoryId: category.id
      }
    });

    expect(permissions.length).toBe(1);

    const permission = permissions[0];

    expect(permission).toMatchObject(
      expect.objectContaining<ProposalCategoryPermission>({
        id: expect.any(String),
        spaceId: space.id,
        roleId: null,
        public: null,
        proposalCategoryId: category.id,
        permissionLevel: 'full_access',
        categoryOperations: [],
        proposalOperations: []
      })
    );
  });

  it('should throw an error if the proposal category does not exist', async () => {
    await expect(assignDefaultProposalCategoryPermissions({ proposalCategoryId: v4() })).rejects.toBeInstanceOf(
      ProposalCategoryNotFoundError
    );
  });
});
