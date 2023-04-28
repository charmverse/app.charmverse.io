import { prisma } from '@charmverse/core';
import type { Space, User } from '@charmverse/core/dist/prisma';

import { UndesirableOperationError } from 'lib/utilities/errors';
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

  it('should throw an error if the category contains proposals', async () => {
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
});
