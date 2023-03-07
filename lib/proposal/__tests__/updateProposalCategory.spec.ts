import type { Prisma, Proposal, ProposalCategory, ProposalCategoryPermission, Space } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { updateProposalCategory } from '../updateProposalCategory';

describe('updateProposalCategory', () => {
  it('should only update proposal category title and colour', async () => {
    const { space, user } = await generateUserAndSpace();
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id,
      title: 'Test'
    });

    const categoryBeforeUpdate = (await prisma.proposalCategory.findUnique({
      where: {
        id: proposalCategory.id
      },
      include: {
        proposal: true,
        proposalCategoryPermissions: true,
        space: true
      }
    })) as ProposalCategory & {
      proposal: Proposal[];
      proposalCategoryPermissions: ProposalCategoryPermission[];
      space: Space;
    };

    const categoryUpdate: Prisma.ProposalCategoryUpdateInput = {
      id: v4(),
      // Update the linked space
      space: { update: { id: v4(), name: 'New name' } },
      proposal: {
        createMany: {
          data: [
            {
              createdBy: user.id,
              status: 'draft',
              spaceId: space.id
            }
          ]
        }
      },
      proposalCategoryPermissions: {
        // Inject a new permission
        create: {
          permissionLevel: 'full_access',
          public: true
        }
      },
      title: 'Test 2',
      color: '#000000'
    };

    await updateProposalCategory(proposalCategory.id, categoryUpdate as any);

    const categoryAfterUpdate = (await prisma.proposalCategory.findUnique({
      where: {
        id: proposalCategory.id
      },
      include: {
        proposal: true,
        proposalCategoryPermissions: true,
        space: true
      }
    })) as ProposalCategory & {
      proposal: Proposal[];
      proposalCategoryPermissions: ProposalCategoryPermission[];
      space: Space;
    };

    expect(categoryAfterUpdate?.title).toEqual(categoryUpdate.title);
    expect(categoryAfterUpdate?.color).toEqual(categoryUpdate.color);

    // Dropped updates
    expect(categoryAfterUpdate?.id).toEqual(categoryBeforeUpdate.id);
    expect(categoryAfterUpdate?.space).toEqual(categoryBeforeUpdate.space);
    expect(categoryAfterUpdate?.proposalCategoryPermissions.length).toEqual(0);
    expect(categoryAfterUpdate?.proposal.length).toEqual(0);
  });
});
