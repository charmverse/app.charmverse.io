import { prisma } from 'db';
import { typedKeys } from 'lib/utilities/objects';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { computePagePermissionsUsingProposalPermissions } from '../pagePermissionsWithComputeProposalPermissions';

describe('pagePermissionsWithComputeProposalPermissions', () => {
  it('should convert proposal permissions, and also account for a public-level page permission', async () => {
    const { user, space } = await generateUserAndSpace();

    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const proposal = await generateProposal({
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'discussion'
    });

    await prisma.pagePermission.create({
      data: {
        public: true,
        page: { connect: { id: proposal.id } },
        permissionLevel: 'view'
      }
    });

    const permissions = await computePagePermissionsUsingProposalPermissions({
      resourceId: proposal.id,
      userId: undefined
    });

    typedKeys(permissions).forEach((key) => {
      if (key === 'read') {
        expect(permissions[key]).toBe(true);
      } else {
        expect(permissions[key]).toBe(false);
      }
    });
  });
});
