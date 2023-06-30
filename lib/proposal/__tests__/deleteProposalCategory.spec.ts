import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import { InvalidInputError, UndesirableOperationError } from 'lib/utilities/errors';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { deleteProposalCategory } from '../deleteProposalCategory';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  space = generated.space;
  user = generated.user;
});

describe('deleteProposalCategory', () => {
  it('should delete a category', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    await deleteProposalCategory(proposalCategory.id);

    const afterDelete = await prisma.proposalCategory.findUnique({
      where: {
        id: proposalCategory.id
      }
    });
    expect(afterDelete).toBeNull();
  });

  it('should delete the category with all attached proposals, only if they are all marked as deleted', async () => {
    const { user: localUser, space: localSpace } = await testUtilsUser.generateUserAndSpace();

    const deletedProposalCategory = await generateProposalCategory({
      spaceId: localSpace.id
    });

    const deletedProposal = await generateProposal({
      categoryId: deletedProposalCategory.id,
      spaceId: localSpace.id,
      userId: localUser.id,
      deletedAt: new Date()
    });

    const unaffectedCategory = await generateProposalCategory({
      spaceId: localSpace.id
    });

    const proposalInUnaffectedCategory = await generateProposal({
      categoryId: unaffectedCategory.id,
      spaceId: localSpace.id,
      userId: localUser.id,
      deletedAt: new Date()
    });

    await deleteProposalCategory(deletedProposalCategory.id);

    const categories = await prisma.proposalCategory.findMany({
      where: {
        spaceId: localSpace.id
      }
    });

    const proposals = await prisma.proposal.findMany({
      where: {
        spaceId: localSpace.id
      },
      include: {
        page: {
          select: {
            id: true
          }
        }
      }
    });

    expect(categories.length).toBe(1);
    expect(categories[0].id).toBe(unaffectedCategory.id);

    expect(proposals.length).toBe(1);
    expect(proposals[0].id).toBe(proposalInUnaffectedCategory.id);
    expect(proposals[0].page?.id).toBe(proposalInUnaffectedCategory.id);
  });

  it('should throw an error if the category contains non deleted proposals', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    await generateProposal({
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: user.id
    });

    await expect(deleteProposalCategory(proposalCategory.id)).rejects.toBeInstanceOf(UndesirableOperationError);
  });

  it('should throw an error if categoryId is invalid', async () => {
    await expect(deleteProposalCategory(null as any)).rejects.toBeInstanceOf(InvalidInputError);
    await expect(deleteProposalCategory('not UUID')).rejects.toBeInstanceOf(InvalidInputError);
  });
});
