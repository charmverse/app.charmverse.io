import { prisma } from '@charmverse/core';
import type { ProposalCategoryPermission } from '@charmverse/core/prisma';

import { generateUserAndSpace } from 'testing/setupDatabase';

import type { CreateProposalCategoryInput } from '../createProposalCategory';
import { createProposalCategory } from '../createProposalCategory';

describe('createProposalCategory', () => {
  it('should create a proposal category accessible to the space by default', async () => {
    const { space } = await generateUserAndSpace();

    const createInput: CreateProposalCategoryInput = {
      title: 'Test Category permissions',
      spaceId: space.id
    };

    const proposalCategory = await createProposalCategory({ data: createInput });

    const permissions = await prisma.proposalCategoryPermission.findMany({
      where: {
        proposalCategoryId: proposalCategory.id
      }
    });

    expect(permissions).toHaveLength(1);

    const permission = permissions[0];

    expect(permission).toMatchObject(
      expect.objectContaining<ProposalCategoryPermission>({
        id: expect.any(String),
        spaceId: space.id,
        roleId: null,
        public: null,
        proposalCategoryId: proposalCategory.id,
        permissionLevel: 'full_access',
        categoryOperations: [],
        proposalOperations: []
      })
    );
  });
});
